import { redirect } from "next/navigation"

import { LeavesManager } from "@/app/components/admin/leaves-manager"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const metadata = { title: "Time Off" }

export default async function LeavePage() {
  const session = await auth()
  if (!session?.user || session.user.role === "EMPLOYEE") redirect("/scan")

  const [leaves, employees] = await Promise.all([
    prisma.leave.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return (
    <LeavesManager
      leaves={leaves.map((l) => ({
        id: l.id,
        userId: l.userId,
        type: l.type,
        status: l.status,
        reason: l.reason,
        startDate: l.startDate,
        endDate: l.endDate,
        user: { name: l.user.name },
      }))}
      employees={employees.map((e) => ({ id: e.id, name: e.name }))}
    />
  )
}