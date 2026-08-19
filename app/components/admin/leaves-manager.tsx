"use client"

import * as React from "react"
import { useActionState } from "react"
import { Check, Pencil, Plus, Trash2, X } from "lucide-react"

import { upsertLeave, deleteLeave, setLeaveStatus } from "@/app/actions/admin"
import { LeaveType } from "@/generated/prisma/enums"
import {
  FormField,
  FormSelect,
  FormTextarea,
  SubmitButton,
} from "@/app/components/admin/form"
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
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const typeOptions = Object.values(LeaveType).map((v) => ({
  value: v,
  label: v === "ANNUAL" ? "Annual" : v === "SICK" ? "Sick" : "Unpaid",
}))

const statusVariant: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  APPROVED: "default",
  PENDING: "outline",
  REJECTED: "destructive",
}

function label(t: string) {
  return t === "ANNUAL" ? "Annual" : t === "SICK" ? "Sick" : "Unpaid"
}

function toInput(value?: string | Date | null) {
  if (!value) return undefined
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return undefined
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`
}

export function LeavesManager({
  leaves,
  employees,
}: {
  leaves: Array<{
    id: string
    userId: string
    type: string
    status: string
    reason: string | null
    startDate: Date
    endDate: Date
    user: { name: string }
  }>
  employees: Array<{ id: string; name: string }>
}) {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<typeof leaves[number] | null>(null)
  const [state, formAction, pending] = useActionState(upsertLeave, { error: undefined })

  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Time Off</CardTitle>
          <CardDescription>Kelola pengajuan cuti &amp; izin</CardDescription>
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
              Ajukan
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pegawai</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Rentang</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell className="font-medium">{leave.user.name}</TableCell>
                  <TableCell>{label(leave.type)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {toInput(leave.startDate)} — {toInput(leave.endDate)}
                  </TableCell>
                  <TableCell className="max-w-48 truncate text-muted-foreground">
                    {leave.reason ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[leave.status] ?? "secondary"}>
                      {leave.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {leave.status === "PENDING" ? (
                        <>
                          <form action={setLeaveStatus}>
                            <input type="hidden" name="id" value={leave.id} />
                            <input type="hidden" name="status" value="APPROVED" />
                            <Button variant="ghost" size="icon-sm" type="submit">
                              <Check />
                            </Button>
                          </form>
                          <form action={setLeaveStatus}>
                            <input type="hidden" name="id" value={leave.id} />
                            <input type="hidden" name="status" value="REJECTED" />
                            <Button variant="ghost" size="icon-sm" type="submit">
                              <X />
                            </Button>
                          </form>
                        </>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditing(leave)
                          setOpen(true)
                        }}
                      >
                        <Pencil />
                      </Button>
                      <form action={deleteLeave.bind(null, leave.id)}>
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
            <SheetTitle>{editing ? "Edit Cuti" : "Ajukan Cuti"}</SheetTitle>
          </SheetHeader>
          <form action={formAction} className="flex flex-1 flex-col">
            {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
            <div className="flex flex-1 flex-col gap-4 px-4 py-4">
              <FormSelect
                label="Pegawai"
                name="userId"
                required
                defaultValue={editing?.userId}
                options={employees.map((e) => ({ value: e.id, label: e.name }))}
              />
              <FormSelect
                label="Tipe"
                name="type"
                required
                defaultValue={editing?.type}
                options={typeOptions}
              />
              <FormField
                label="Dari tanggal"
                name="startDate"
                type="date"
                required
                defaultValue={toInput(editing?.startDate)}
              />
              <FormField
                label="Sampai tanggal"
                name="endDate"
                type="date"
                required
                defaultValue={toInput(editing?.endDate)}
              />
              <FormTextarea
                label="Alasan"
                name="reason"
                hint="Opsional"
                defaultValue={editing?.reason ?? undefined}
              />
              {state?.error ? (
                <p className="text-sm text-destructive">{state.error}</p>
              ) : null}
            </div>
            <SheetFooter className="border-t">
              <SubmitButton pending={pending}>
                {editing ? "Simpan Perubahan" : "Ajukan Cuti"}
              </SubmitButton>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}