import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isWithinOfficeRadius, OFFICE_RADIUS_METERS } from "@/lib/geo"
import shiftHours from "@/data/shift.json"

const QR_CODE_KEY = process.env.ATTEDANCE_QRCODE_KEY

// Toleransi keterlambatan (menit) sebelum status berubah dari PRESENT ke LATE.
// Dulu per-shift lewat WorkSchedule.shift.graceMinutes; sekarang shift cuma
// enum statis (lihat data/shift.json), jadi grace-nya juga dibuat global.
const GRACE_MINUTES = 30

// POST /api/attendance/scan  { token, latitude, longitude }
// Employee self-scan: QR is a static code physically posted at the office
// (not per-session/rotating), scanned by the employee's own phone. Because
// the QR itself carries no location proof once photographed, the browser's
// geolocation at scan time is required and checked against OFFICE_RADIUS_METERS
// in lib/geo.ts — this is what actually enforces "must be physically at the
// office", not the QR token match.
// First scan of a day clocks in; a later scan clocks out. Attendance works
// every day (shift enum applies daily, no per-day schedule row anymore).
// Clock-in is rejected before shift.startTime and after shift.endTime.
// Clock-out is rejected before shift.endTime (no early clock-out).
// Shift start (+grace) decides PRESENT/LATE.
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 401 })
  }
  if (!QR_CODE_KEY) {
    return NextResponse.json(
      { error: "Server belum dikonfigurasi untuk scan" },
      { status: 500 }
    )
  }

  const { token, latitude, longitude } = await req.json().catch(() => ({}))
  if (typeof token !== "string" || !token.trim()) {
    return NextResponse.json({ error: "Token QR tidak ada" }, { status: 400 })
  }

  if (token.trim() !== QR_CODE_KEY) {
    return NextResponse.json({ error: "Kode QR tidak valid" }, { status: 403 })
  }

  // Lokasi wajib dikirim dari browser (navigator.geolocation di client).
  // Tanpa ini, QR statis yang sudah difoto bisa dipakai absen dari mana saja.
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return NextResponse.json(
      { error: "Lokasi tidak terdeteksi. Aktifkan akses lokasi di browser Anda" },
      { status: 400 }
    )
  }

  if (!isWithinOfficeRadius(latitude, longitude)) {
    return NextResponse.json(
      {
        error: `Anda berada di luar radius kantor (maks ${OFFICE_RADIUS_METERS}m). Absen hanya bisa dilakukan di lokasi kantor`,
      },
      { status: 403 }
    )
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 })
  }

  // Shift sekarang enum langsung di User, jam kerjanya di-lookup dari
  // data/shift.json (statis, sama untuk semua user dengan shift yang sama).
  const shift = shiftHours[user.shift]
  if (!shift) {
    return NextResponse.json(
      { error: "Jadwal kerja belum diatur" },
      { status: 409 }
    )
  }

  const now = new Date()

  // "Hari ini" sebagai kunci tanggal, disimpan sebagai UTC midnight dari
  // hari kalender LOKAL (getFullYear/getMonth/getDate membaca komponen
  // lokal sesuai TZ proses, lalu Date.UTC meng-encode-nya sebagai timestamp
  // UTC). Ini harus sama persis dengan konstruksi yang dipakai di query
  // dashboard (utcDay di dashboard.ts), kalau tidak, CheckIn.date tidak
  // akan cocok dengan rentang yang di-query dashboard.
  const today = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  )

  // getDay(): 0 = Minggu → hari libur. (Hari kalender lokal, basis yang sama dengan `today`.)
  // if (now.getDay() === 0) {
  //   return NextResponse.json({ error: "Hari Minggu libur" }, { status: 409 })
  // }

  // start = startTime shift hari ini, dihitung dalam local time (TZ proses)
  // karena langsung dibandingkan dengan `now`. Clock-in harus terjadi
  // pada/setelah waktu ini.
  const [sh, sm] = shift.startTime.split(":").map(Number)
  const start = new Date(now)
  start.setHours(sh, sm, 0, 0)

  // end = endTime shift hari ini, basis local time yang sama dengan `start`.
  // Clock-in harus terjadi sebelum ini; clock-out hanya boleh setelah ini
  // (tidak boleh pulang sebelum shift selesai).
  const [eh, em] = shift.endTime.split(":").map(Number)
  const end = new Date(now)
  end.setHours(eh, em, 0, 0)
  if (eh === 0 && em === 0) end.setDate(end.getDate() + 1) // endTime "00:00" → tengah malam nanti malam

  const existing = await prisma.checkIn.findUnique({
    where: { userId_date: { userId: user.id, date: today } },
  })
  if (existing) {
    // Sudah clock in hari ini → scan ini berarti clock out.
    if (existing.clockOut) {
      return NextResponse.json(
        { error: `${user.name} sudah check out hari ini` },
        { status: 409 }
      )
    }

    // Tidak boleh clock out sebelum shift selesai.
    if (now < end) {
      return NextResponse.json(
        { error: `Shift belum selesai (berakhir jam ${shift.endTime})` },
        { status: 409 }
      )
    }

    const updated = await prisma.checkIn.update({
      where: { id: existing.id },
      data: { clockOut: now },
    })

    return NextResponse.json({
      ok: true,
      employee: { name: user.name },
      clockIn: updated.clockIn.toISOString(),
      clockOut: updated.clockOut!.toISOString(),
      status: updated.status,
      lateMinutes: updated.lateMinutes,
      schedule: {
        shift: user.shift,
        startTime: shift.startTime,
        endTime: shift.endTime,
      },
    })
  }

  // Belum ada record → scan ini berarti clock in.

  // Tidak boleh clock in sebelum shift mulai.
  if (now < start) {
    return NextResponse.json(
      { error: `Shift belum mulai (mulai jam ${shift.startTime})` },
      { status: 409 }
    )
  }

  if (now > end) {
    return NextResponse.json(
      { error: "Shift hari ini sudah berakhir" },
      { status: 409 }
    )
  }

  // Keterlambatan: setelah (waktu mulai shift + menit toleransi).
  const graceEnd = new Date(start.getTime() + GRACE_MINUTES * 60_000)

  let status: "PRESENT" | "LATE" = "PRESENT"
  let lateMinutes = 0
  if (now > graceEnd) {
    status = "LATE"
    lateMinutes = Math.floor((now.getTime() - graceEnd.getTime()) / 60_000)
  }

  const checkIn = await prisma.checkIn.create({
    data: {
      userId: user.id,
      date: today,
      clockIn: now,
      status,
      lateMinutes,
    },
  })

  return NextResponse.json({
    ok: true,
    employee: { name: user.name },
    clockIn: checkIn.clockIn.toISOString(),
    clockOut: checkIn.clockOut?.toISOString() ?? null,
    status: checkIn.status,
    lateMinutes: checkIn.lateMinutes,
    schedule: {
      shift: user.shift,
      startTime: shift.startTime,
      endTime: shift.endTime,
    },
  })
}