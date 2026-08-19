"use client"

import { useEffect, useState } from "react"
import { z } from "zod"

import { getDashboardCharts } from "@/app/actions/dashboard"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartsSchema = z.object({
  weekly: z.array(
    z.object({
      day: z.string(),
      present: z.number(),
      late: z.number(),
      absent: z.number(),
    })
  ),
  departments: z.array(
    z.object({ dept: z.string(), employees: z.number(), present: z.number() })
  ),
})

type ChartsData = z.infer<typeof chartsSchema>

const attendanceConfig = {
  present: {
    label: "Hadir",
    color: "var(--chart-1)",
  },
  late: {
    label: "Terlambat",
    color: "var(--chart-3)",
  },
  absent: {
    label: "Absen",
    color: "var(--chart-6)",
  },
} satisfies ChartConfig

const departmentConfig = {
  present: {
    label: "Hadir",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function Charts() {
  const [data, setData] = useState<ChartsData>({ weekly: [], departments: [] })

  useEffect(() => {
    getDashboardCharts().then((result) => {
      if (!("error" in result)) setData(chartsSchema.parse(result))
    })
  }, [])

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:grid-cols-2 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kehadiran Mingguan</CardTitle>
          <CardDescription>Hadir, terlambat &amp; absen minggu ini</CardDescription>
        </CardHeader>
        <ChartContainer config={attendanceConfig} className="aspect-auto h-[220px] w-full">
          <AreaChart accessibilityLayer data={data.weekly}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="present"
              type="natural"
              fill="var(--color-present)"
              stroke="var(--color-present)"
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="late"
              type="natural"
              fill="var(--color-late)"
              stroke="var(--color-late)"
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="absent"
              type="natural"
              fill="var(--color-absent)"
              stroke="var(--color-absent)"
              strokeWidth={2}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kehadiran per Departemen</CardTitle>
          <CardDescription>Hadir vs jumlah karyawan</CardDescription>
        </CardHeader>
        <ChartContainer config={departmentConfig} className="aspect-auto h-[220px] w-full">
          <BarChart accessibilityLayer data={data.departments}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="dept"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis width={28} tickLine={false} axisLine={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <span className="tabular-nums">{value} hadir</span>
                  )}
                />
              }
            />
            <Bar
              dataKey="present"
              fill="var(--color-present)"
              radius={4}
              maxBarSize={36}
            />
          </BarChart>
        </ChartContainer>
      </Card>
    </div>
  )
}
