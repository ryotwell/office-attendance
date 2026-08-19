import { redirect } from "next/navigation"

import { auth } from "@/auth"

export default async function Home() {
  const session = await auth()
  const role = session?.user?.role

  // Admin/HR/Manager see the dashboard; everyone else goes straight to scan.
  if (role && role !== "EMPLOYEE") {
    redirect("/dashboard")
  }
  redirect("/scan")
}