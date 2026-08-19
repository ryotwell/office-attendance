"use client"

import * as React from "react"
import { useActionState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { upsertShift, deleteShift } from "@/app/actions/admin"
import { FormField, SubmitButton } from "@/app/components/admin/form"
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

export function ShiftsManager({
  shifts,
}: {
  shifts: Array<{
    id: string
    name: string
    startTime: string
    endTime: string
    graceMinutes: number
    assignments: number
  }>
}) {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<typeof shifts[number] | null>(null)
  const [state, formAction, pending] = useActionState(upsertShift, { error: undefined })

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shifts</CardTitle>
          <CardDescription>Kelola jam kerja &amp; toleransi keterlambatan</CardDescription>
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
                <TableHead>Mulai</TableHead>
                <TableHead>Selesai</TableHead>
                <TableHead>Grace (menit)</TableHead>
                <TableHead>Jadwal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">{shift.name}</TableCell>
                  <TableCell className="tabular-nums">{shift.startTime}</TableCell>
                  <TableCell className="tabular-nums">{shift.endTime}</TableCell>
                  <TableCell className="text-muted-foreground">{shift.graceMinutes}</TableCell>
                  <TableCell className="text-muted-foreground">{shift.assignments}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditing(shift)
                          setOpen(true)
                        }}
                      >
                        <Pencil />
                      </Button>
                      <form action={deleteShift.bind(null, shift.id)}>
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
            <SheetTitle>{editing ? "Edit Shift" : "Tambah Shift"}</SheetTitle>
          </SheetHeader>
          <form action={formAction} className="flex flex-1 flex-col">
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <div className="flex flex-1 flex-col gap-4 px-4 py-4">
              <FormField label="Nama shift" name="name" required defaultValue={editing?.name} />
              <FormField
                label="Jam mulai"
                name="startTime"
                type="time"
                required
                defaultValue={editing?.startTime}
              />
              <FormField
                label="Jam selesai"
                name="endTime"
                type="time"
                required
                defaultValue={editing?.endTime}
              />
              <FormField
                label="Grace period (menit)"
                name="graceMinutes"
                type="number"
                required
                defaultValue={String(editing?.graceMinutes ?? 15)}
              />
              {state?.error ? (
                <p className="text-sm text-destructive">{state.error}</p>
              ) : null}
            </div>
            <SheetFooter className="border-t">
              <SubmitButton pending={pending}>
                {editing ? "Simpan Perubahan" : "Tambah Shift"}
              </SubmitButton>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}