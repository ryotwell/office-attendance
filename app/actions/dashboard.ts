"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { AttendanceStatus } from "@/generated/prisma/enums"

const DAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum"]

const utcDay = (d: Date) =>
  new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))

// Monday of the current week at UTC midnight (matches how CheckIn.date is stored).
function weekStart() {
  const now = new Date()
  return utcDay(new Date(now.getTime() - ((now.getDay() + 6) % 7) * 86_400_000))
}

const key = (d: Date) => d.toISOString().slice(0, 10)

const deptLabel = (name: string) =>
  name.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

export type DashboardChartsData = {
  weekly: { day: string; present: number; late: number; absent: number }[]
  departments: { dept: string; employees: number; present: number }[]
}

export async function getDashboardCharts(): Promise<
  DashboardChartsData | { error: string }
> {
  const session = await auth()
  if (!session?.user || session.user.role === "EMPLOYEE") {
    return { error: "Tidak diizinkan" }
  }

  const ws = weekStart()
  const weekEnd = new Date(ws.getTime() + 7 * 86_400_000)
  const today = utcDay(new Date())
  const todayEnd = new Date(today.getTime() + 86_400_000)

  const [weekCheckIns, deptRows, todayCheckIns] = await Promise.all([
    prisma.checkIn.findMany({
      where: { date: { gte: ws, lt: weekEnd } },
      select: { date: true, status: true },
    }),
    prisma.department.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { users: { where: { isActive: true } } } },
      },
    }),
    prisma.checkIn.findMany({
      where: {
        date: { gte: today, lt: todayEnd },
        status: { in: [AttendanceStatus.PRESENT, AttendanceStatus.LATE] },
      },
      select: { user: { select: { departmentId: true } } },
    }),
  ])

  const byDay = new Map<string, { present: number; late: number; absent: number }>()
  for (const c of weekCheckIns) {
    const k = key(c.date)
    const row = byDay.get(k) ?? { present: 0, late: 0, absent: 0 }
    if (c.status === "PRESENT") row.present++
    else if (c.status === "LATE") row.late++
    else if (c.status === "ABSENT") row.absent++
    byDay.set(k, row)
  }

  const weekly = DAY_LABELS.map((day, i) => {
    const row = byDay.get(key(new Date(ws.getTime() + i * 86_400_000)))
    return { day, present: row?.present ?? 0, late: row?.late ?? 0, absent: row?.absent ?? 0 }
  })

  const presentByDept = new Map<string, number>()
  for (const c of todayCheckIns) {
    const deptId = c.user.departmentId
    if (deptId) presentByDept.set(deptId, (presentByDept.get(deptId) ?? 0) + 1)
  }

  const departments = deptRows
    .map((d) => ({
      dept: deptLabel(d.name),
      employees: d._count.users,
      present: presentByDept.get(d.id) ?? 0,
    }))
    .sort((a, b) => b.employees - a.employees)

  return { weekly, departments }
}
