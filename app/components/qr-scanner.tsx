"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { Html5Qrcode } from "html5-qrcode"

type ScanState = "idle" | "scanning" | "success" | "error"

const SOUND_SUCCESS_SRC = "/success.mp3"
const SOUND_FAILED_SRC = "/failed.mp3"

// Ambil posisi GPS sekali dari browser. enableHighAccuracy supaya HP pakai
// GPS chip (bukan cuma cell tower/wifi triangulation) — penting karena
// radius toleransi kantor cuma OFFICE_RADIUS_METERS.
function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation tidak didukung browser ini"))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: 0,
    })
  })
}

// Preload satu file audio sampai benar-benar siap diputar tanpa jeda
// (canplaythrough), bukan cuma sampai metadata kebaca.
function preloadAudio(src: string): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(src)
    audio.preload = "auto"

    const cleanup = () => {
      audio.removeEventListener("canplaythrough", onReady)
      audio.removeEventListener("error", onError)
    }
    const onReady = () => {
      cleanup()
      resolve(audio)
    }
    const onError = () => {
      cleanup()
      reject(new Error(`Gagal memuat audio: ${src}`))
    }

    audio.addEventListener("canplaythrough", onReady, { once: true })
    audio.addEventListener("error", onError, { once: true })
    audio.load()
  })
}

// Putar dari awal setiap kali dipanggil (kalau lagi diputar & dipanggil
// lagi cepat, restart daripada ditumpuk/di-skip).
function playAudio(audio: HTMLAudioElement | null) {
  if (!audio) return
  audio.currentTime = 0
  void audio.play().catch(() => {})
}

export function QrScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const initializedRef = useRef(false)
  const startInFlightRef = useRef(false)
  const successAudioRef = useRef<HTMLAudioElement | null>(null)
  const failedAudioRef = useRef<HTMLAudioElement | null>(null)
  const [state, setState] = useState<ScanState>("idle")
  const [message, setMessage] = useState("")
  const [audioReady, setAudioReady] = useState(false)

  // Load penuh success.mp3 & failed.mp3 dulu sebelum kamera/absensi
  // diaktifkan, supaya suara tidak telat/putus di scan pertama.
  useEffect(() => {
    let cancelled = false

    setMessage("Menyiapkan suara…")
    Promise.all([preloadAudio(SOUND_SUCCESS_SRC), preloadAudio(SOUND_FAILED_SRC)])
      .then(([success, failed]) => {
        if (cancelled) return
        successAudioRef.current = success
        failedAudioRef.current = failed
        setAudioReady(true)
        setMessage("")
      })
      .catch(() => {
        if (cancelled) return
        // Tetap lanjut tanpa suara daripada mengunci absensi selamanya.
        setAudioReady(true)
        setMessage("")
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Bekukan scanner begitu sebuah kode berhasil didecode, supaya QR yang
  // masih disorongkan ke kamera tidak terus-menerus ke-scan berulang.
  // Watchdog di bawah akan menyalakan ulang instance yang SAMA setelahnya.
  const handleScan = useCallback(async (decodedText: string) => {
    const scanner = scannerRef.current
    if (scanner?.isScanning) {
      await scanner.stop().catch(() => {})
    }

    setState("scanning")
    setMessage("Mendapatkan lokasi…")

    // Ambil GPS SETELAH kode terdeteksi (bukan di awal mount) supaya prompt
    // izin lokasi browser muncul tepat saat user benar-benar mau absen, dan
    // posisinya paling baru saat submit.
    let coords: { latitude: number; longitude: number }
    try {
      const position = await getCurrentPosition()
      coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }
    } catch {
      setState("error")
      setMessage(
        "Tidak bisa mengambil lokasi. Aktifkan izin lokasi lalu coba lagi"
      )
      playAudio(failedAudioRef.current)
      return
    }

    setMessage("Mengirim…")

    try {
      const res = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: decodedText,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setState("error")
        setMessage(data.error ?? "Scan gagal")
        playAudio(failedAudioRef.current)
        return
      }
      setState("success")
      playAudio(successAudioRef.current)
      // QR yang sama. Scan pertama hari itu = clock in (clockOut masih
      // null); scan berikutnya = clock out — tampilkan mana yang terjadi.
      setMessage(
        [
          data.clockOut
            ? `Check out ${data.employee?.name ?? ""}`
            : `Check in ${data.employee?.name ?? ""}`,
          data.schedule
            ? `Shift ${data.schedule.shift} · ${data.schedule.startTime} – ${data.schedule.endTime}`
            : "Tidak ada jadwal hari ini",
          data.clockOut ?? data.clockIn ?? "",
        ]
          .filter(Boolean)
          .join(" · ")
      )
    } catch {
      setState("error")
      setMessage("Terjadi kesalahan jaringan, coba lagi")
      playAudio(failedAudioRef.current)
    }
  }, [])

  const startScanner = useCallback(
    async (scanner: Html5Qrcode) => {
      if (scanner.isScanning || startInFlightRef.current) return
      startInFlightRef.current = true

      try {
        await scanner
          .start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 220, height: 220 } },
            handleScan,
            () => {}
          )
        setState("idle")
      } catch {
        setState("error")
      } finally {
        startInFlightRef.current = false
      }
    },
    [handleScan]
  )

  // Kiosk tetap menyala: berhenti sejenak setelah ada hasil, lalu
  // dilanjutkan lagi pada instance yang sama.
  useEffect(() => {
    if (state !== "success" && state !== "error") return
    const t = setTimeout(() => {
      const scanner = scannerRef.current
      if (scanner) void startScanner(scanner)
    }, 2500)
    return () => clearTimeout(t)
  }, [state, startScanner])

  useEffect(() => {
    if (!audioReady) return
    if (initializedRef.current) return
    if (!document.getElementById("qr-reader")) return
    initializedRef.current = true

    const scanner = new Html5Qrcode("qr-reader")
    scannerRef.current = scanner
    setState("idle")
    void startScanner(scanner)

    return () => {
      // StrictMode / React 19 me-mount effect dua kali, tapi elemen DOM
      // masih terpasang selama unmount sintetis tersebut. Hanya benar-benar
      // bongkar instance ketika elemennya sungguh-sungguh hilang (navigasi
      // sebenarnya keluar dari halaman). Ini menjaga HANYA SATU instance
      // yang hidup selama remount StrictMode — mencegah bug video ganda.
      if (!document.getElementById("qr-reader")) {
        initializedRef.current = false
        scannerRef.current = null
        const teardown = async () => {
          if (scanner.isScanning) {
            await scanner.stop().catch(() => {})
          }
          scanner.clear()
        }
        void teardown()
      }
    }
  }, [audioReady, startScanner])

  return (
    <div className="flex flex-col gap-4">
      <div id="qr-reader" className="w-full overflow-hidden rounded-xl" />

      <div
        aria-live="polite"
        className={`flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm ${
          state === "success"
            ? "bg-[#0ca30c]/10 text-[#006300] dark:text-[#0ca30c]"
            : state === "error"
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground"
        }`}
      >
        {state === "scanning" && <span>Sedang scan…</span>}
        {message ||
          (!audioReady
            ? "Menyiapkan suara…"
            : state === "idle"
              ? "Arahkan kamera ke kode QR Kantor"
              : "")}
      </div>
    </div>
  )
}