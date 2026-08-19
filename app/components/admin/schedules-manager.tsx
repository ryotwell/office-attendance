"use client"

import * as React from "react"
import { useActionState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { upsertSchedule, deleteSchedule } from "@/app/actions/admin"
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

export function SchedulesManager({
  schedules,
  employees,
  shifts,
}: {
  schedules: Array<{
    id: string
    userId: string
    shiftId: string
    user: { name: string }
    shift: { name: string }
  }>
  employees: Array<{ id: string; name: string }>
  shifts: Array<{ id: string; name: string }>
}) {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<typeof schedules[number] | null>(null)
  const [state, formAction, pending] = useActionState(upsertSchedule, { error: undefined })

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Schedules</CardTitle>
          <CardDescription>Atur shift harian per karyawan — berlaku Senin–Sabtu, Minggu libur</CardDescription>
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
                <TableHead>Karyawan</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.user.name}</TableCell>
                  <TableCell>{s.shift.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditing(s)
                          setOpen(true)
                        }}
                      >
                        <Pencil />
                      </Button>
                      <form action={deleteSchedule.bind(null, s.id)}>
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
            <SheetTitle>{editing ? "Edit Jadwal" : "Tambah Jadwal"}</SheetTitle>
          </SheetHeader>
          <form action={formAction} className="flex flex-1 flex-col">
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <div className="flex flex-1 flex-col gap-4 px-4 py-4">
              <FormSelect
                label="Karyawan"
                name="userId"
                required
                defaultValue={editing?.userId}
                options={employees.map((e) => ({ value: e.id, label: e.name }))}
              />
              <FormSelect
                label="Shift"
                name="shiftId"
                required
                defaultValue={editing?.shiftId}
                options={shifts.map((s) => ({ value: s.id, label: s.name }))}
              />
              {state?.error ? (
                <p className="text-sm text-destructive">{state.error}</p>
              ) : null}
            </div>
            <SheetFooter className="border-t">
              <SubmitButton pending={pending}>
                {editing ? "Simpan Perubahan" : "Tambah Jadwal"}
              </SubmitButton>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}