import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const QR_CODE_KEY = process.env.ATTEDANCE_QRCODE_KEY

// POST /api/attendance/scan  { token }
// Kiosk scan: token harus cocok dengan ATTEDANCE_QRCODE_KEY di .env. Scan
// pertama dalam sehari = clock in; scan berikutnya = clock out. Absensi
// berlaku setiap hari kecuali Minggu (tidak ada cek WorkSchedule per hari —
// satu jadwal berlaku untuk semua hari kerja).
// Clock-in ditolak sebelum shift.startTime dan setelah shift.endTime.
// Clock-out ditolak sebelum shift.endTime (tidak boleh pulang lebih awal).
// Shift start (+ toleransi) menentukan status PRESENT/LATE.
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

  const { token } = await req.json().catch(() => ({}))
  if (typeof token !== "string" || !token.trim()) {
    return NextResponse.json({ error: "Token QR tidak ada" }, { status: 400 })
  }

  if (token.trim() !== QR_CODE_KEY) {
    return NextResponse.json({ error: "Kode QR tidak valid" }, { status: 403 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })
  if (!user || !user.isActive) {
    return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 })
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

  // Absensi membutuhkan WorkSchedule untuk user ini. Satu schedule bersifat
  // unik per user dan berlaku untuk setiap hari kerja.
  const schedule = await prisma.workSchedule.findUnique({
    where: { userId: user.id },
    include: { shift: true },
  })
  if (!schedule) {
    return NextResponse.json(
      { error: "Jadwal kerja belum diatur" },
      { status: 409 }
    )
  }

  // start = startTime shift hari ini, dihitung dalam local time (TZ proses)
  // karena langsung dibandingkan dengan `now`. Clock-in harus terjadi
  // pada/setelah waktu ini.
  const [sh, sm] = schedule.shift.startTime.split(":").map(Number)
  const start = new Date(now)
  start.setHours(sh, sm, 0, 0)

  // end = endTime shift hari ini, basis local time yang sama dengan `start`.
  // Clock-in harus terjadi sebelum ini; clock-out hanya boleh setelah ini
  // (tidak boleh pulang sebelum shift selesai).
  const [eh, em] = schedule.shift.endTime.split(":").map(Number)
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
        { error: `Shift belum selesai (berakhir jam ${schedule.shift.endTime})` },
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
        shift: schedule.shift.name,
        startTime: schedule.shift.startTime,
        endTime: schedule.shift.endTime,
      },
    })
  }

  // Belum ada record → scan ini berarti clock in.

  // Tidak boleh clock in sebelum shift mulai.
  if (now < start) {
    return NextResponse.json(
      { error: `Shift belum mulai (mulai jam ${schedule.shift.startTime})` },
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
  const graceEnd = new Date(start.getTime() + schedule.shift.graceMinutes * 60_000)

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
      shift: schedule.shift.name,
      startTime: schedule.shift.startTime,
      endTime: schedule.shift.endTime,
    },
  })
}