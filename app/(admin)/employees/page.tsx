import { redirect } from "next/navigation"

import { EmployeesManager } from "@/app/components/admin/employees-manager"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const metadata = { title: "Employees" }

export default async function EmployeesPage() {
  const session = await auth()
  if (!session?.user || session.user.role === "EMPLOYEE") redirect("/scan")

  const [employees, departments] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        departmentId: true,
        position: true,
        joinedAt: true,
        department: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
  ])

  return (
    <EmployeesManager employees={employees} departments={departments} />
  )
}