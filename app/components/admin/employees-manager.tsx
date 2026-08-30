"use client"

import * as React from "react"
import { useActionState } from "react"
import { Pencil, Plus, Search, Trash2 } from "lucide-react"

import { upsertEmployee, deleteEmployee } from "@/app/actions/admin"
import {
  Department,
  Role,
  Shift,
  type Department as DepartmentType,
  type Role as RoleType,
  type Shift as ShiftType,
} from "@/generated/prisma/enums"
import {
  FormField,
  FormSelect,
  SubmitButton,
} from "@/app/components/admin/form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import shifts from '@/data/shift.json'

type ShiftDetail = {
  startTime: string
  endTime: string
}

type EmployeeRow = {
  id: string
  name: string
  username: string
  role: RoleType
  department: DepartmentType
  position: string | null
  joinedAt: Date | null
  shift: ShiftType
}

const roleOptions = Object.values(Role).map((v) => ({ value: v, label: v }))
const shiftData = shifts as Record<string, ShiftDetail>

const shiftOptions = Object.values(Shift).map((v) => {
  const shift = shiftData[v]

  return {
    value: v,
    label: v !== 'PAGIATAUSIANG' ? `${v} (${shift.startTime} - ${shift.endTime})` : `PAGI atau SIANG`,
  }
})

const ALL_VALUE = "__all__"
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

// Enum values look like "PEOPLE_OPS" — format them into "People Ops" for display.
function formatDepartmentLabel(name: string) {
  return name
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

const departmentOptions = Object.values(Department).map((v) => ({
  value: v,
  label: formatDepartmentLabel(v),
}))

function toDateInput(value?: string | Date | null) {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function EmployeesManager({
  employees,
}: {
  employees: EmployeeRow[]
}) {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<EmployeeRow | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<EmployeeRow | null>(null)
  const [state, formAction, pending] = useActionState(upsertEmployee, {
    error: undefined,
  })

  // --- search & filter state ---
  const [search, setSearch] = React.useState("")
  const [departmentFilter, setDepartmentFilter] = React.useState<string>(ALL_VALUE)
  const [roleFilter, setRoleFilter] = React.useState<string>(ALL_VALUE)
  const [shiftFilter, setShiftFilter] = React.useState<string>(ALL_VALUE)

  // --- pagination state ---
  const [page, setPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(10)

  const openCreate = () => {
    setEditing(null)
    setOpen(true)
  }
  const openEdit = (row: EmployeeRow) => {
    setEditing(row)
    setOpen(true)
  }

  const filteredEmployees = React.useMemo(() => {
    const q = search.trim().toLowerCase()

    return employees.filter((emp) => {
      const matchesSearch =
        q.length === 0 ||
        emp.name.toLowerCase().includes(q) ||
        emp.username.toLowerCase().includes(q) ||
        (emp.position ?? "").toLowerCase().includes(q)

      const matchesDepartment =
        departmentFilter === ALL_VALUE || emp.department === departmentFilter

      const matchesRole = roleFilter === ALL_VALUE || emp.role === roleFilter

      const matchesShift = shiftFilter === ALL_VALUE || emp.shift === shiftFilter

      return matchesSearch && matchesDepartment && matchesRole && matchesShift
    })
  }, [employees, search, departmentFilter, roleFilter, shiftFilter])

  // Reset ke halaman 1 setiap kali filter/search/pageSize berubah
  React.useEffect(() => {
    setPage(1)
  }, [search, departmentFilter, roleFilter, shiftFilter, pageSize])

  const totalItems = filteredEmployees.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(page, totalPages)

  const paginatedEmployees = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredEmployees.slice(start, start + pageSize)
  }, [filteredEmployees, currentPage, pageSize])

  const hasActiveFilters =
    search.trim().length > 0 ||
    departmentFilter !== ALL_VALUE ||
    roleFilter !== ALL_VALUE ||
    shiftFilter !== ALL_VALUE

  const resetFilters = () => {
    setSearch("")
    setDepartmentFilter(ALL_VALUE)
    setRoleFilter(ALL_VALUE)
    setShiftFilter(ALL_VALUE)
  }

  const rangeStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employees</CardTitle>
          <CardDescription>Kelola akun &amp; data karyawan</CardDescription>
          <CardAction>
            <Button variant="outline" size="sm" onClick={openCreate}>
              <Plus />
              Tambah
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {/* Search & Filters */}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari nama, username, posisi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <Select value={departmentFilter} onValueChange={(v) => setDepartmentFilter(v ?? ALL_VALUE)}>
                <SelectTrigger className="w-full sm:w-[170px]">
                  <SelectValue placeholder="Departemen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Semua Departemen</SelectItem>
                  {departmentOptions.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v ?? ALL_VALUE)}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Semua Role</SelectItem>
                  {roleOptions.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={shiftFilter} onValueChange={(v) => setShiftFilter(v ?? ALL_VALUE)}>
                <SelectTrigger className="col-span-2 w-full sm:col-span-1 sm:w-[150px]">
                  <SelectValue placeholder="Shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Semua Shift</SelectItem>
                  {Object.values(Shift).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="col-span-2 sm:col-span-1 sm:w-auto"
                >
                  Reset
                </Button>
              ) : null}
            </div>
          </div>

          {/* Mobile: card list */}
          <div className="flex flex-col gap-3 md:hidden">
            {paginatedEmployees.length === 0 ? (
              <div className="rounded-lg border py-10 text-center text-sm text-muted-foreground">
                Tidak ada karyawan yang cocok.
              </div>
            ) : (
              paginatedEmployees.map((emp) => (
                <div key={emp.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{emp.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {emp.username}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(emp)}>
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(emp)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="secondary">
                      {formatDepartmentLabel(emp.department)}
                    </Badge>
                    <Badge variant="outline">{emp.shift}</Badge>
                    <Badge variant="outline">{emp.role}</Badge>
                  </div>

                  {emp.position ? (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {emp.position}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>

          {/* Desktop / tablet: table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Departemen</TableHead>
                  <TableHead>Posisi</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Tidak ada karyawan yang cocok.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEmployees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-xs text-muted-foreground">{emp.username}</div>
                      </TableCell>
                      <TableCell>{formatDepartmentLabel(emp.department)}</TableCell>
                      <TableCell>{emp.position}</TableCell>
                      <TableCell className="text-muted-foreground">{emp.shift}</TableCell>
                      <TableCell className="text-muted-foreground">{emp.role}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(emp)}>
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setDeleteTarget(emp)}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              {totalItems === 0
                ? "0 hasil"
                : `Menampilkan ${rangeStart}–${rangeEnd} dari ${totalItems} karyawan`}
            </p>

            <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
              <div className="flex items-center justify-between gap-2 sm:justify-start">
                <span className="text-sm text-muted-foreground">Baris</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => setPageSize(v ? Number(v) : 10)}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-1 sm:justify-start">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </Button>
                <span className="px-2 text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Selanjutnya
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader className="border-b">
            <SheetTitle>{editing ? "Edit Karyawan" : "Tambah Karyawan"}</SheetTitle>
          </SheetHeader>
          <form action={formAction} className="flex min-h-0 flex-1 flex-col">
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
              <FormField
                label="Nama lengkap"
                name="name"
                required
                defaultValue={editing?.name}
              />
              <FormField
                label="Username"
                name="username"
                type="text"
                required
                defaultValue={editing?.username}
              />
              <FormField
                label="Password"
                name="password"
                type="password"
                required={!editing}
                hint={editing ? "Kosongkan jika tidak diubah" : "Min. 6 karakter"}
              />
              <FormSelect
                label="Role"
                name="role"
                required
                defaultValue={editing?.role}
                options={roleOptions}
              />
              <FormSelect
                label="Departemen"
                name="department"
                required
                defaultValue={editing?.department}
                options={departmentOptions}
              />
              <FormSelect
                label="Shift"
                name="shift"
                required
                defaultValue={editing?.shift}
                options={shiftOptions}
              />
              <FormField
                label="Posisi"
                name="position"
                required
                defaultValue={editing?.position ?? ""}
              />
              <FormField
                label="Tanggal bergabung"
                name="joinedAt"
                type="date"
                required
                defaultValue={toDateInput(editing?.joinedAt)}
              />
              {state?.error ? (
                <p className="text-sm text-destructive">{state.error}</p>
              ) : null}
            </div>
            <SheetFooter className="border-t">
              <SubmitButton pending={pending}>
                {editing ? "Simpan Perubahan" : "Tambah Karyawan"}
              </SubmitButton>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus karyawan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Tindakan ini akan menghapus akun "${deleteTarget.name}" (${deleteTarget.username}) secara permanen. Data ini tidak bisa dikembalikan.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <form
              action={async () => {
                if (!deleteTarget) return
                await deleteEmployee(deleteTarget.id)
                setDeleteTarget(null)
              }}
            >
              <AlertDialogAction
                type="submit"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Hapus
              </AlertDialogAction>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}