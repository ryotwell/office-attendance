import { redirect } from "next/navigation"

import { SchedulesManager } from "@/app/components/admin/schedules-manager"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const metadata = { title: "Schedules" }

export default async function SchedulesPage() {
  const session = await auth()
  if (!session?.user || session.user.role === "EMPLOYEE") redirect("/scan")

  const [schedules, employees, shifts] = await Promise.all([
    prisma.workSchedule.findMany({
      include: {
        user: { select: { name: true } },
        shift: { select: { name: true } },
      },
      orderBy: { user: { name: "asc" } },
    }),
    prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.shift.findMany({ orderBy: { name: "asc" } }),
  ])

  return (
    <SchedulesManager
      schedules={schedules.map((s) => ({
        id: s.id,
        userId: s.userId,
        shiftId: s.shiftId,
        user: { name: s.user.name },
        shift: { name: s.shift.name },
      }))}
      employees={employees.map((e) => ({ id: e.id, name: e.name }))}
      shifts={shifts.map((s) => ({ id: s.id, name: s.name }))}
    />
  )
}