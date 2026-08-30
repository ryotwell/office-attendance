"use client"

import * as React from "react"
import Link from "next/link"
import {
  CalendarClock,
  CalendarDays,
  ChartColumn,
  CircleUserRound,
  Clock,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCheck,
  Users,
} from "lucide-react"

import { signOutAction } from "@/app/actions/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

function getInitials(name?: string) {
  if (!name) return "U"
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function thisMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

function navMain(month: string) {
  return [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Kehadiran",
      url: "/attendances",
      icon: UserCheck,
      items: [
        { title: "Hari Ini", url: "/attendances" },
        { title: "Bulan Ini", url: `/attendances?month=${month}` },
      ],
    },
    {
      title: "Cuti",
      url: "/leave",
      icon: CalendarDays,
    },
    {
      title: "Karyawan",
      url: "/employees",
      icon: Users,
    },
  ]
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user?: {
    name?: string | null
    username?: string | null
    image?: string | null
  }
}) {
  const { isMobile } = useSidebar()
  const items = navMain(thisMonth())

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="group-data-[collapsible=icon]:p-0!"
            >
              <img
                src="/assets/logo.png"
                alt="Satak Office"
                className="h-8 w-auto shrink-0"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Satak Office</span>
                <span className="truncate text-xs text-muted-foreground">
                  Kehadiran
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Umum</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.slice(0, 2).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={item.isActive}
                    render={item.url !== "#" ? <Link href={item.url} /> : undefined}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub>
                      {item.items.map((sub) => (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton render={<Link href={sub.url} />}>
                            <span>{sub.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Kelola</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.slice(2, 7).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    render={item.url !== "#" ? <Link href={item.url} /> : undefined}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub>
                      {item.items.map((sub) => (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton render={<Link href={sub.url} />}>
                            <span>{sub.title}</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Pengaturan"
                  render={<Link href="/settings" />}
                >
                  <Settings />
                  <span>Pengaturan</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <form action={signOutAction} className="w-full">
                  <SidebarMenuButton type="submit" tooltip="Keluar">
                    <LogOut />
                    <span>Keluar</span>
                  </SidebarMenuButton>
                </form>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="aria-expanded:bg-muted"
                  />
                }
              >
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={user?.image ?? ""} alt={user?.name ?? ""} />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(user?.name ?? undefined)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.name ?? "Pengguna"}</span>
                  <span className="truncate text-xs text-foreground/70">
                    {user?.username}
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-56"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                {/* DropdownMenuLabel must live inside a DropdownMenuGroup
                    when using Base UI's Menu primitives, otherwise
                    MenuGroupContext is missing and it throws at runtime. */}
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="size-8">
                        <AvatarImage src={user?.image ?? ""} alt={user?.name ?? ""} />
                        <AvatarFallback className="rounded-lg">
                          {getInitials(user?.name ?? undefined)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                          {user?.name ?? "Pengguna"}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {user?.username}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                {/* <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <CircleUserRound />
                    Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Clock />
                    Kehadiran Saya
                  </DropdownMenuItem>
                </DropdownMenuGroup> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={
                    <form action={signOutAction}>
                      <button type="submit" className="flex w-full items-center gap-2">
                        Keluar
                      </button>
                    </form>
                  }
                >
                  <LogOut />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}