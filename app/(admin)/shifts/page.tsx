import { redirect } from "next/navigation"

import { ShiftsManager } from "@/app/components/admin/shifts-manager"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const metadata = { title: "Shifts" }

export default async function ShiftsPage() {
  const session = await auth()
  if (!session?.user || session.user.role === "EMPLOYEE") redirect("/scan")

  const shifts = await prisma.shift.findMany({
    include: { _count: { select: { workSchedules: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <ShiftsManager
      shifts={shifts.map((s) => ({
        id: s.id,
        name: s.name,
        startTime: s.startTime,
        endTime: s.endTime,
        graceMinutes: s.graceMinutes,
        assignments: s._count.workSchedules,
      }))}
    />
  )
}