import { redirect } from "next/navigation"

import { auth } from "@/auth"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata = { title: "Pengaturan" }

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  HR: "HR",
  MANAGER: "Manajer",
  EMPLOYEE: "Karyawan",
}

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user || session.user.role === "EMPLOYEE") redirect("/scan")

  const user = session.user

  const rows: Array<[string, string]> = [
    ["Nama", user.name ?? "—"],
    ["Username", user.username ?? "—"],
    ["Peran", roleLabel[user.role ?? ""] ?? user.role ?? "—"],
  ]

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pengaturan</CardTitle>
          <CardDescription>Detail akun Anda</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {rows.map(([label, value]) => (
            <div key={label}>
              <div className="text-sm text-muted-foreground">{label}</div>
              <div className="mt-1 font-medium">{value}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
