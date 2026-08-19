import * as React from "react"

import { AppSidebar } from "@/app/components/app-sidebar"
import { AttendanceTable } from "@/app/components/attendance-table"
import { Charts } from "@/app/components/charts"
import { SectionCards } from "@/app/components/section-cards"
import { SiteHeader } from "@/app/components/site-header"
import { auth } from "@/auth"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default async function Page() {
  const session = await auth()

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar user={session?.user} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <Charts />
              <AttendanceTable />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
