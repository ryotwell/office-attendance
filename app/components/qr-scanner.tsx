"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { Html5Qrcode } from "html5-qrcode"

type ScanState = "idle" | "scanning" | "success" | "error"

export function QrScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const initializedRef = useRef(false)
  const startInFlightRef = useRef(false)
  const [state, setState] = useState<ScanState>("idle")
  const [message, setMessage] = useState("")

  // Freeze the scanner the instant a code is decoded so a held QR cannot fire
  // repeatedly. The watchdog below relaunches the SAME instance afterwards.
  const handleScan = useCallback(async (decodedText: string) => {
    const scanner = scannerRef.current
    if (scanner?.isScanning) {
      await scanner.stop().catch(() => {})
    }

    setState("scanning")
    setMessage("Submitting…")

    try {
      const res = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: decodedText }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setState("error")
        setMessage(data.error ?? "Scan failed")
        return
      }
      setState("success")
      // Same QR. First scan of the day clocks in (clockOut is null);
      // a later scan clocks out — say which happened.
      setMessage(
        [
          data.clockOut
            ? `Checked out ${data.employee?.name ?? ""}`
            : `Checked in ${data.employee?.name ?? ""}`,
          data.schedule
            ? `Shift ${data.schedule.shift} · ${data.schedule.startTime} – ${data.schedule.endTime}`
            : "No schedule today",
          data.clockOut ?? data.clockIn ?? "",
        ]
          .filter(Boolean)
          .join(" · ")
      )
    } catch {
      setState("error")
      setMessage("Network error, try again")
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

  // Kiosk stays live: pause on a verdict, then resume on the same instance.
  useEffect(() => {
    if (state !== "success" && state !== "error") return
    const t = setTimeout(() => {
      const scanner = scannerRef.current
      if (scanner) void startScanner(scanner)
    }, 2500)
    return () => clearTimeout(t)
  }, [state, startScanner])

  useEffect(() => {
    if (initializedRef.current) return
    if (!document.getElementById("qr-reader")) return
    initializedRef.current = true

    const scanner = new Html5Qrcode("qr-reader")
    scannerRef.current = scanner
    setState("idle")
    void startScanner(scanner)

    return () => {
      // StrictMode / React 19 double-mounts effects, but the DOM element is
      // still mounted during a synthetic unmount. Only tear down when the
      // element is truly gone (real navigation away). This keeps ONE instance
      // alive across StrictMode remounts — the duplicate-video bug.
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
  }, [startScanner])

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
        {state === "scanning" && <span>Scanning…</span>}
        {message || (state === "idle" ? "Point the camera at an employee QR code" : "")}
      </div>
    </div>
  )
}