"use client"

import * as React from "react"
import { useActionState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { upsertDepartment, deleteDepartment } from "@/app/actions/admin"
import { DepartmentName } from "@/generated/prisma/enums"
import { FormSelect, SubmitButton } from "@/app/components/admin/form"
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

const nameOptions = Object.values(DepartmentName).map((v) => ({
  value: v,
  label: v,
}))

export function DepartmentsManager({
  departments,
}: {
  departments: Array<{ id: string; name: string; employees: number }>
}) {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<typeof departments[number] | null>(null)
  const [state, formAction, pending] = useActionState(upsertDepartment, {
    error: undefined,
  })

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Departments</CardTitle>
          <CardDescription>Kelola daftar departemen perusahaan</CardDescription>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(null)
                setOpen(true)
              }}
            >
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
                <TableHead>Jumlah Karyawan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell className="text-muted-foreground">{dept.employees}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditing(dept)
                          setOpen(true)
                        }}
                      >
                        <Pencil />
                      </Button>
                      <form action={deleteDepartment.bind(null, dept.id)}>
                        <Button variant="ghost" size="icon-sm" type="submit">
                          <Trash2 />
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>{editing ? "Edit Departemen" : "Tambah Departemen"}</SheetTitle>
          </SheetHeader>
          <form action={formAction} className="flex flex-1 flex-col">
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <div className="flex flex-1 flex-col gap-4 px-4 py-4">
              <FormSelect
                label="Nama departemen"
                name="name"
                required
                defaultValue={editing?.name}
                options={nameOptions}
              />
              {state?.error ? (
                <p className="text-sm text-destructive">{state.error}</p>
              ) : null}
            </div>
            <SheetFooter className="border-t">
              <SubmitButton pending={pending}>
                {editing ? "Simpan Perubahan" : "Tambah Departemen"}
              </SubmitButton>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}