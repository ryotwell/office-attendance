import { AttendancesManager } from "@/app/components/admin/attendances-manager"

export const metadata = { title: "Attendance" }

function toInput(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export default async function AttendancesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; month?: string }>
}) {
  const { date: rawDate, month: rawMonth } = await searchParams

  // Month view: ?month=YYYY-MM shows every check-in in that month.
  const month = rawMonth && /^\d{4}-\d{2}$/.test(rawMonth) ? rawMonth : null

  // Daily view: default to today; ignore any invalid date string.
  const base = rawDate ? new Date(`${rawDate}T00:00:00`) : new Date()
  const selected = Number.isNaN(base.getTime()) ? new Date() : base
  const selectedInput = toInput(selected)
  const currentMonth = toInput(new Date()).slice(0, 7)

  return (
    <AttendancesManager
      date={selectedInput}
      month={month}
      currentMonth={currentMonth}
    />
  )
}