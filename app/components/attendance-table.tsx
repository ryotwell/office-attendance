"use client"

import * as React from "react"
import { ArrowUpRight } from "lucide-react"

import { getTodayAttendance, type TodayAttendanceRow } from "@/app/actions/admin"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { useRouter } from "next/navigation"

const statusVariant: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  PRESENT: "default",
  LATE: "outline",
  ON_LEAVE: "secondary",
  ABSENT: "destructive",
}

const statusLabel: Record<string, string> = {
  PRESENT: "Hadir",
  LATE: "Terlambat",
  ON_LEAVE: "Cuti",
  ABSENT: "Absen",
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function timeLabel(value: Date | null) {
  if (!value) return "—"
  const d = new Date(value)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function Row({ row }: { row: TodayAttendanceRow }) {
  return (
    <TableRow key={row.id}>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarFallback className="text-xs">{initials(row.name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{row.name}</span>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{row.department ?? "—"}</TableCell>
      <TableCell className="tabular-nums">{timeLabel(row.clockIn)}</TableCell>
      <TableCell className="tabular-nums">{timeLabel(row.clockOut)}</TableCell>
      <TableCell className="text-right">
        <Badge variant={statusVariant[row.status] ?? "secondary"}>
          {statusLabel[row.status] ?? row.status}a
        </Badge>
        {row.status === "LATE" && row.lateMinutes > 0 ? (
          <div className="mt-1 text-xs text-muted-foreground">
            Telat {row.lateMinutes} menit
          </div>
        ) : null}
      </TableCell>
    </TableRow>
  )
}

export function AttendanceTable() {
  const [rows, setRows] = React.useState<TodayAttendanceRow[] | null>(null)

  const router = useRouter()

  React.useEffect(() => {
    getTodayAttendance().then(setRows).catch(() => setRows([]))
  }, [])

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kehadiran Hari Ini</CardTitle>
          <CardDescription>Check-in terbaru di seluruh kantor</CardDescription>
          <CardAction>
            <Button variant="outline" size="sm"
                  onClick={() => router.push("/attendances")}>
              Lihat semua
              <ArrowUpRight />
            </Button>
          </CardAction>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Karyawan</TableHead>
              <TableHead>Departemen</TableHead>
              <TableHead>Masuk</TableHead>
              <TableHead>Keluar</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows === null
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-7 rounded-full" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-5 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              : rows.map((row) => <Row key={row.id} row={row} />)}
            {rows !== null && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Belum ada check-in hari ini
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}