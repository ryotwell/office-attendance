import { redirect } from "next/navigation"

import { EmployeesManager } from "@/app/components/admin/employees-manager"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const metadata = { title: "Employees" }

export default async function EmployeesPage() {
  const session = await auth()
  if (!session?.user || session.user.role === "EMPLOYEE") redirect("/scan")

  const employees = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      department: true,
      position: true,
      joinedAt: true,
      shift: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return <EmployeesManager employees={employees} />
}