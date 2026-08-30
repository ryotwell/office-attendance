"use client"

import * as React from "react"
import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { Download, Pencil, Plus, Trash2 } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { getAttendances, upsertCheckIn, deleteCheckIn } from "@/app/actions/admin"
import {
  FormField,
  FormSelect,
  FormTextarea,
  SubmitButton,
} from "@/app/components/admin/form"
import { AttendanceStatus } from "@/generated/prisma/enums"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const statusOptions = Object.values(AttendanceStatus).map((v) => ({
  value: v,
  label: v === "PRESENT" ? "Hadir" : v === "LATE" ? "Terlambat" : v === "ABSENT" ? "Absen" : "Cuti",
}))

const statusVariant: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  PRESENT: "default",
  LATE: "secondary",
  ABSENT: "destructive",
  ON_LEAVE: "outline",
}

function toDateTime(value?: string | Date | null) {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const h = String(d.getHours()).padStart(2, "0")
  const min = String(d.getMinutes()).padStart(2, "0")
  return `${y}-${m}-${day}T${h}:${min}`
}

function clockLabel(value: Date | null) {
  if (!value) return "—"
  const d = new Date(value)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function duration(start: Date, end: Date | null) {
  if (!end) return "—"
  const mins = Math.max(0, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60_000))
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}j ${mins % 60}m`
}

function label(status: string) {
  return statusOptions.find((s) => s.value === status)?.label ?? status
}

// "YYYY-MM" -> "Agustus 2026"
function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number)
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ]
  return `${months[m - 1]} ${y}`
}

// Group month check-ins by calendar date.
type CheckInRow = {
  id: string
  userId: string
  date: Date
  clockIn: Date
  clockOut: Date | null
  status: string
  lateMinutes: number
  notes: string | null
  user: { name: string }
}

function byDate(checkIns: CheckInRow[]) {
  return Array.from(
    checkIns.reduce((map, c) => {
      const d = new Date(c.date)
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
      const list = map.get(key) ?? []
      list.push(c)
      map.set(key, list)
      return map
    }, new Map<string, CheckInRow[]>()),
    ([date, items]) => ({ date, items })
  ).sort((a, b) => a.date.localeCompare(b.date))
}

export function AttendancesManager({
  date,
  month,
  currentMonth,
}: {
  date: string
  month: string | null
  currentMonth: string
}) {
  const router = useRouter()
  const [checkIns, setCheckIns] = React.useState<CheckInRow[] | null>(null)
  const [employees, setEmployees] = React.useState<Array<{ id: string; name: string }>>([])
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<CheckInRow | null>(null)
  const [state, formAction, pending] = useActionState(upsertCheckIn, { error: undefined })

  React.useEffect(() => {
    getAttendances(date, month)
      .then((r) => {
        setCheckIns(r.checkIns)
        setEmployees(r.employees)
      })
      .catch(() => setCheckIns([]))
  }, [date, month])

  const present = (checkIns ?? []).filter((c) => c.status === "PRESENT" || c.status === "LATE").length
  const late = (checkIns ?? []).filter((c) => c.status === "LATE").length

  const download = (format: "xlsx" | "pdf", range: "today" | "week" | "month") => {
    window.location.assign(`/api/attendance/export?format=${format}&range=${range}&date=${date}`)
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="flex items-center gap-2">
          {month ? (
            <>
              <label htmlFor="month" className="text-sm text-muted-foreground">
                Bulan
              </label>
              <Input
                key={month}
                id="month"
                name="month"
                type="month"
                defaultValue={month}
                onChange={(e) => {
                  if (e.target.value) router.push(`/attendances?month=${e.target.value}`)
                }}
                className="w-auto"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/attendances?date=${date}`)}
              >
                Lihat hari ini
              </Button>
            </>
          ) : (
            <>
              <label htmlFor="date" className="text-sm text-muted-foreground">
                Tanggal
              </label>
              <Input
                key={date}
                id="date"
                name="date"
                type="date"
                defaultValue={date}
                onChange={(e) => {
                  if (e.target.value) router.push(`/attendances?date=${e.target.value}`)
                }}
                className="w-auto"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/attendances?month=${currentMonth}`)}
              >
                Bulan ini
              </Button>
            </>
          )}
        </form>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="outline" size="sm">
                  <Download />
                  Export
                </Button>
              }
            />
            <DropdownMenuContent>
              <DropdownMenuGroup>
                <DropdownMenuLabel>Excel</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => download("xlsx", "today")}>
                  Hari Ini
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => download("xlsx", "week")}>
                  Minggu Ini
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => download("xlsx", "month")}>
                  Bulan Ini
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>PDF</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => download("pdf", "today")}>
                  Hari Ini
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => download("pdf", "week")}>
                  Minggu Ini
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => download("pdf", "month")}>
                  Bulan Ini
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditing(null)
              setOpen(true)
            }}
          >
            <Plus />
            Catat Kehadiran
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Hadir</div>
            <div className="text-2xl font-semibold">{checkIns === null ? "—" : present}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Terlambat</div>
            <div className="text-2xl font-semibold">{checkIns === null ? "—" : late}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Cuti</div>
            <div className="text-2xl font-semibold">
              {(checkIns ?? []).filter((c) => c.status === "ON_LEAVE").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="text-2xl font-semibold">{checkIns?.length ?? "—"}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">
            {month ? `Attendance — ${monthLabel(month)}` : `Attendance — ${date}`}
          </CardTitle>
          <CardDescription>
            {month
              ? "Ringkasan kehadiran harian pada bulan dipilih"
              : "Data kehadiran per karyawan pada tanggal dipilih"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {checkIns === null ? (
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Memuat…
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : month ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Hadir</TableHead>
                  <TableHead>Terlambat</TableHead>
                  <TableHead>Cuti</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byDate(checkIns).map(({ date: day, items }) => (
                  <TableRow key={day}>
                    <TableCell className="font-medium">{day}</TableCell>
                    <TableCell>
                      {items.filter((c) => c.status === "PRESENT" || c.status === "LATE").length}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {items.filter((c) => c.status === "LATE").length}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {items.filter((c) => c.status === "ON_LEAVE").length}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/attendances?date=${day}`)}
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {checkIns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Belum ada data kehadiran pada bulan ini
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Karyawan</TableHead>
                  <TableHead>Masuk</TableHead>
                  <TableHead>Keluar</TableHead>
                  <TableHead>Durasi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkIns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{clockLabel(c.clockIn)}</TableCell>
                    <TableCell className="text-muted-foreground">{clockLabel(c.clockOut)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {duration(c.clockIn, c.clockOut)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[c.status] ?? "secondary"}>
                        {label(c.status)}
                      </Badge>
                      {c.status === "LATE" && c.lateMinutes > 0 ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Telat {c.lateMinutes} menit
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditing(c)
                            setOpen(true)
                          }}
                        >
                          <Pencil />
                        </Button>
                        <form action={deleteCheckIn.bind(null, c.id, date)}>
                          <Button variant="ghost" size="icon-sm" type="submit">
                            <Trash2 />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {checkIns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Belum ada data kehadiran pada tanggal ini
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>{editing ? "Edit Kehadiran" : "Catat Kehadiran"}</SheetTitle>
          </SheetHeader>
          <form action={formAction} className="flex flex-1 flex-col">
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <input type="hidden" name="date" value={date} />
            <div className="flex flex-1 flex-col gap-4 px-4 py-4">
              {editing ? (
                <input type="hidden" name="userId" value={editing.userId} />
              ) : (
                <FormSelect
                  label="Karyawan"
                  name="userId"
                  required
                  options={employees.map((e) => ({ value: e.id, label: e.name }))}
                />
              )}
              <FormField
                label="Jam masuk"
                name="clockIn"
                type="datetime-local"
                required
                defaultValue={toDateTime(editing?.clockIn)}
              />
              <FormField
                label="Jam keluar"
                name="clockOut"
                type="datetime-local"
                hint="Kosongkan jika belum keluar"
                defaultValue={toDateTime(editing?.clockOut)}
              />
              <FormSelect
                label="Status"
                name="status"
                required
                defaultValue={editing?.status}
                options={statusOptions}
              />
              <FormField
                label="Keterlambatan (menit)"
                name="lateMinutes"
                type="number"
                defaultValue={String(editing?.lateMinutes ?? 0)}
              />
              <FormTextarea
                label="Catatan"
                name="notes"
                hint="Opsional"
                defaultValue={editing?.notes ?? undefined}
              />
              {state?.error ? (
                <p className="text-sm text-destructive">{state.error}</p>
              ) : null}
            </div>
            <SheetFooter className="border-t">
              <SubmitButton pending={pending}>
                {editing ? "Simpan Perubahan" : "Catat Kehadiran"}
              </SubmitButton>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}