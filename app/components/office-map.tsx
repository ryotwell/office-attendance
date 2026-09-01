"use client"

import { useEffect, useRef, useState } from "react"
import type * as Leaflet from "leaflet"

type Coordinates = { latitude: number; longitude: number }
type OfficeMapProps = { officeLocation: Coordinates; officeRadiusMeters: number }

function isWithinRadius(user: Coordinates, office: Coordinates, radius: number) {
  const radians = (value: number) => (value * Math.PI) / 180
  const dLat = radians(user.latitude - office.latitude)
  const dLng = radians(user.longitude - office.longitude)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(office.latitude)) *
      Math.cos(radians(user.latitude)) *
      Math.sin(dLng / 2) ** 2
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= radius
}

export function OfficeMap({ officeLocation, officeRadiusMeters }: OfficeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [locationMessage, setLocationMessage] = useState("Mengambil lokasi Anda…")
  const validLocation = Number.isFinite(officeLocation.latitude) && Number.isFinite(officeLocation.longitude)
  const validRadius = Number.isFinite(officeRadiusMeters) && officeRadiusMeters > 0

  useEffect(() => {
    if (!mapRef.current || !validLocation || !validRadius) return
    let map: Leaflet.Map | undefined
    let cancelled = false

    void import("leaflet").then(({ default: L }) => {
      if (cancelled || !mapRef.current) return
      map = L.map(mapRef.current).setView([officeLocation.latitude, officeLocation.longitude], 17)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)
      L.marker([officeLocation.latitude, officeLocation.longitude], {
        icon: L.divIcon({ className: "office-map-marker", html: '<span aria-hidden="true">🏢</span>', iconSize: [32, 32], iconAnchor: [16, 16] }),
      }).addTo(map).bindPopup("Lokasi kantor")
      L.circle([officeLocation.latitude, officeLocation.longitude], {
        radius: officeRadiusMeters, color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.15, weight: 2,
      }).addTo(map).bindPopup(`Radius absensi: ${officeRadiusMeters} meter`)

      if (!navigator.geolocation) {
        setLocationMessage("Geolocation tidak didukung browser ini")
        return
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelled || !map) return
          const user = { latitude: position.coords.latitude, longitude: position.coords.longitude }
          setLocationMessage(isWithinRadius(user, officeLocation, officeRadiusMeters) ? "Anda berada dalam radius kantor" : "Anda berada di luar radius kantor")
          L.circleMarker([user.latitude, user.longitude], { radius: 8, color: "#166534", fillColor: "#22c55e", fillOpacity: 1, weight: 3 }).addTo(map).bindPopup("Lokasi Anda")
          map.fitBounds([[officeLocation.latitude, officeLocation.longitude], [user.latitude, user.longitude]], { padding: [24, 24] })
        },
        () => setLocationMessage("Lokasi Anda tidak dapat diakses"),
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
      )
    })

    return () => { cancelled = true; map?.remove() }
  }, [officeLocation, officeRadiusMeters, validLocation, validRadius])

  if (!validLocation || !validRadius) return <p className="text-xs text-destructive">Lokasi kantor belum dikonfigurasi dengan benar.</p>

  return (
    <div className="space-y-2">
      <div ref={mapRef} className="h-48 w-full overflow-hidden rounded-md border" aria-label="Peta lokasi kantor, lokasi user, dan radius absensi" />
      <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{locationMessage}</span><span>Radius {officeRadiusMeters} m</span></div>
    </div>
  )
}
