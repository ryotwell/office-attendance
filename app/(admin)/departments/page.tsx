import { redirect } from "next/navigation"

import { DepartmentsManager } from "@/app/components/admin/departments-manager"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const metadata = { title: "Departments" }

export default async function DepartmentsPage() {
  const session = await auth()
  if (!session?.user || session.user.role === "EMPLOYEE") redirect("/scan")

  const departments = await prisma.department.findMany({
    include: { _count: { select: { users: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <DepartmentsManager
      departments={departments.map((d) => ({
        id: d.id,
        name: d.name,
        employees: d._count.users,
      }))}
    />
  )
}