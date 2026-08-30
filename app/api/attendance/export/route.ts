import ExcelJS from "exceljs"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import type { NextRequest } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

type Range = "today" | "week" | "month"
type Format = "xlsx" | "pdf"

const RANGES: Range[] = ["today", "week", "month"]
const FORMATS: Format[] = ["xlsx", "pdf"]

const STATUS_LABEL: Record<string, string> = {
  PRESENT: "Hadir",
  LATE: "Terlambat",
  ABSENT: "Absen",
  ON_LEAVE: "Cuti",
}

// Label shift untuk laporan.
const SHIFT_LABEL: Record<string, string> = {
  PAGI: "Pagi",
  SIANG: "Siang",
  FULLTIME: "Fulltime",
  PAGIATAUSIANG: "Rolling (Pagi/Siang)",
}

const DAY_LABEL = [
  "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu",
]

const dateOf = (dt: Date) => dt.toISOString().slice(0, 10)

// Nama hari dari kolom @db.Date, dibaca sebagai komponen UTC karena
// CheckIn.date disimpan sebagai UTC midnight dari hari kalender lokal.
function dayOf(dt: Date) {
  const d = new Date(dt)
  return DAY_LABEL[d.getUTCDay()]
}

function timeOf(dt: Date | null) {
  if (!dt) return "-"
  const d = new Date(dt)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function duration(start: Date, end: Date | null) {
  if (!end) return "-"
  const mins = Math.max(
    0,
    Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60_000)
  )
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}j ${mins % 60}m`
}

// start..end is a half-open [start, end) UTC interval over the @db.Date column.
function rangeBounds(dateStr: string | null, range: Range) {
  const base =
    dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
      ? new Date(`${dateStr}T00:00:00`)
      : new Date()
  const selected = Number.isNaN(base.getTime()) ? new Date() : base
  const y = selected.getFullYear()
  const m = selected.getMonth()
  const d = selected.getDate()

  if (range === "today") {
    return { start: new Date(Date.UTC(y, m, d)), end: new Date(Date.UTC(y, m, d + 1)) }
  }
  if (range === "week") {
    // Indonesian workweek starts Monday.
    const monOffset = (selected.getDay() + 6) % 7
    return {
      start: new Date(Date.UTC(y, m, d - monOffset)),
      end: new Date(Date.UTC(y, m, d - monOffset + 7)),
    }
  }
  return { start: new Date(Date.UTC(y, m, 1)), end: new Date(Date.UTC(y, m + 1, 1)) }
}

// end is exclusive — show the last inclusive day in the label.
function periodLabel(start: Date, end: Date) {
  const last = new Date(end.getTime() - 86_400_000)
  return dateOf(start) === dateOf(last) ? dateOf(start) : `${dateOf(start)} — ${dateOf(last)}`
}

function fileName(range: Range, start: Date, end: Date, format: Format) {
  const period =
    range === "month"
      ? dateOf(start).slice(0, 7)
      : range === "week"
        ? `${dateOf(start)}_${dateOf(new Date(end.getTime() - 86_400_000))}`
        : dateOf(start)
  return `attendance_${range}_${period}.${format}`
}

type Row = {
  date: string
  day: string
  name: string
  department: string
  shift: string
  clockIn: string
  clockOut: string
  duration: string
  status: string
  late: string
  notes: string
}

const HEADERS = [
  "Tanggal",
  "Hari",
  "Nama",
  "Departemen",
  "Shift",
  "Masuk",
  "Keluar",
  "Durasi",
  "Status",
  "Terlambat (mnt)",
  "Catatan",
]

async function xlsxResponse(title: string, rows: Row[], filename: string) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("Kehadiran")

  ws.addRow([title])
  ws.mergeCells(1, 1, 1, HEADERS.length)
  ws.getRow(1).font = { bold: true, size: 12 }
  ws.addRow(HEADERS)
  ws.getRow(2).font = { bold: true }
  rows.forEach((r) =>
    ws.addRow([
      r.date, r.day, r.name, r.department, r.shift,
      r.clockIn, r.clockOut, r.duration, r.status, r.late, r.notes,
    ])
  )

  ws.columns = [
    { width: 12 }, { width: 10 }, { width: 24 }, { width: 18 }, { width: 12 },
    { width: 10 }, { width: 10 }, { width: 12 }, { width: 14 }, { width: 16 }, { width: 24 },
  ]
  ws.views = [{ state: "frozen", ySplit: 2 }]
  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: HEADERS.length } }

  const buf = await wb.xlsx.writeBuffer()
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

async function pdfResponse(title: string, rows: Row[], filename: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  doc.setFontSize(14)
  doc.text(title, 14, 14)
  autoTable(doc, {
    startY: 20,
    head: [HEADERS],
    body: rows.map((r) => [
      r.date, r.day, r.name, r.department, r.shift, r.clockIn, r.clockOut,
      r.duration, r.status, r.late, r.notes,
    ]),
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [31, 41, 55] },
  })

  const buf = doc.output("arraybuffer")
  return new Response(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

// GET /api/attendance/export?format=xlsx|pdf&range=today|week|month&date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role === "EMPLOYEE") {
    return new Response("Unauthorized", { status: 401 })
  }

  const sp = req.nextUrl.searchParams
  const format: Format = FORMATS.includes(sp.get("format") as Format)
    ? (sp.get("format") as Format)
    : "xlsx"
  const range: Range = RANGES.includes(sp.get("range") as Range)
    ? (sp.get("range") as Range)
    : "today"
  const { start, end } = rangeBounds(sp.get("date"), range)

  const checkIns = await prisma.checkIn.findMany({
    where: { date: { gte: start, lt: end } },
    include: {
      user: {
        include: {
          department: true,
        },
      },
    },
    orderBy: [{ date: "asc" }, { user: { name: "asc" } }],
  })

  const rows: Row[] = checkIns.map((c) => ({
    date: dateOf(c.date),
    day: dayOf(c.date),
    name: c.user.name,
    department: c.user.department?.name ?? "-",
    // Tampilkan shift EFEKTIF hari itu (dari CheckIn), bukan User.shift
    // mentah — untuk pegawai rolling (PAGIATAUSIANG) ini menunjukkan
    // apakah hari itu dia masuk sesi Pagi atau Siang.
    shift: SHIFT_LABEL[c.effectiveShift] ?? c.effectiveShift,
    clockIn: timeOf(c.clockIn),
    clockOut: timeOf(c.clockOut),
    duration: duration(c.clockIn, c.clockOut),
    status: STATUS_LABEL[c.status] ?? c.status,
    late: String(c.lateMinutes),
    notes: c.notes ?? "-",
  }))

  const title = `Laporan Kehadiran — ${periodLabel(start, end)}`

  if (format === "pdf") {
    return pdfResponse(title, rows, fileName(range, start, end, "pdf"))
  }
  return xlsxResponse(title, rows, fileName(range, start, end, "xlsx"))
}