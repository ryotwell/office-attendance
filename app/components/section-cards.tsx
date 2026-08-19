"use client"

import * as React from "react"
import { Building2, TrendingDown, TrendingUp, UserCheck, Users } from "lucide-react"

import {
  getDashboardStats,
  type DashboardStats,
} from "@/app/actions/admin"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function buildStats(s: DashboardStats) {
  return [
    {
      label: "Total Karyawan",
      value: String(s.totalEmployees),
      delta: `${s.totalEmployees} aktif`,
      trend: "up",
      note: "Tenaga kerja aktif",
      icon: Users,
    },
    {
      label: "Hadir Hari Ini",
      value: String(s.present),
      delta: `${s.rate}%`,
      trend: "up",
      note: "Tingkat kehadiran",
      icon: UserCheck,
    },
    {
      label: "Sedang Cuti",
      value: String(s.onLeave),
      delta: `${s.sick} sakit`,
      trend: "down",
      note: "Disetujui hari ini",
      icon: Building2,
    },
    {
      label: "Keterlambatan",
      value: String(s.late),
      delta: `${s.lateAvg} m rata-rata`,
      trend: "down",
      note: "Rata-rata menit terlambat",
      icon: TrendingUp,
    },
  ]
}

export function SectionCards() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null)

  React.useEffect(() => {
    getDashboardStats().then(setStats).catch(() => setStats(null))
  }, [])

  const cards = stats ? buildStats(stats) : null

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {!cards
        ? Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="@container/card">
              <CardHeader>
                <CardDescription className="sr-only">Memuat</CardDescription>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
              <CardFooter>
                <Skeleton className="h-4 w-32" />
              </CardFooter>
            </Card>
          ))
        : cards.map((stat) => (
            <Card key={stat.label} className="@container/card">
              <CardHeader>
                <CardDescription>{stat.label}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                  {stat.value}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    {stat.trend === "up" ? (
                      <TrendingUp className="text-[#008300] dark:text-[#0ca30c]" />
                    ) : (
                      <TrendingDown className="text-[#008300] dark:text-[#0ca30c]" />
                    )}
                    {stat.delta}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="flex items-center gap-2 font-medium">
                  <stat.icon className="size-4 text-muted-foreground" />
                  <span className="truncate">{stat.note}</span>
                </div>
              </CardFooter>
            </Card>
          ))}
    </div>
  )
}
