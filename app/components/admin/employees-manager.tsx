"use client"

import * as React from "react"
import { useActionState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { upsertEmployee, deleteEmployee } from "@/app/actions/admin"
import { Role, Shift, type Role as RoleType, type Shift as ShiftType } from "@/generated/prisma/enums"
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
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  position: string | null
  joinedAt: Date | null
  departmentId: string | null
  department: { name: string } | null
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
  departments,
}: {
  employees: EmployeeRow[]
  departments: Array<{ id: string; name: string }>
}) {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<EmployeeRow | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<EmployeeRow | null>(null)
  const [state, formAction, pending] = useActionState(upsertEmployee, {
    error: undefined,
  })

  const openCreate = () => {
    setEditing(null)
    setOpen(true)
  }
  const openEdit = (row: EmployeeRow) => {
    setEditing(row)
    setOpen(true)
  }

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
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div className="font-medium">{emp.name}</div>
                    <div className="text-xs text-muted-foreground">{emp.username}</div>
                  </TableCell>
                  <TableCell>{emp.department?.name ?? "—"}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-lg">
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
                name="departmentId"
                required
                defaultValue={editing?.departmentId ?? ""}
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
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