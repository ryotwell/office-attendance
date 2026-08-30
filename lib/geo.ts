// Koordinat lokasi kantor. Sumber: pin Google Maps kantor.
// Ganti nilai ini kalau kantor pindah lokasi.
export const OFFICE_LOCATION = {
  latitude: Number(process.env.OFFICE_LATITUDE),
  longitude: Number(process.env.OFFICE_LONGITUDE),
}

// Radius toleransi absensi dalam meter. 75m dipilih sebagai titik tengah:
// cukup longgar untuk akurasi GPS HP (bisa meleset 10-100m tergantung sinyal
// dan apakah karyawan ada di dalam gedung), tapi cukup ketat supaya tidak
// bisa absen dari luar kompleks kantor (jalan raya, warung sebelah, dst).
// Naikkan nilai ini kalau banyak karyawan yang komplain ditolak padahal
// sudah di kantor (biasanya karena gedung bertingkat / GPS indoor lemah).
export const OFFICE_RADIUS_METERS = Number(process.env.OFFICE_RADIUS_METERS)

const EARTH_RADIUS_METERS = 6_371_000

function toRadians(deg: number) {
  return (deg * Math.PI) / 180
}

// Jarak antara dua koordinat (lat/lng) dalam meter, pakai formula Haversine.
export function distanceInMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_METERS * c
}

// True kalau titik (lat, lng) berada dalam radius toleransi dari kantor.
export function isWithinOfficeRadius(lat: number, lng: number): boolean {
  const distance = distanceInMeters(
    lat,
    lng,
    OFFICE_LOCATION.latitude,
    OFFICE_LOCATION.longitude
  )
  return distance <= OFFICE_RADIUS_METERS
}