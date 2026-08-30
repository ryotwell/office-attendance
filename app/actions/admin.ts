"use server"

import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import {
  AttendanceStatus,
  DepartmentName,
  LeaveStatus,
  LeaveType,
  Role,
  Shift,
} from "@/generated/prisma/enums"

const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
  message: "Tanggal tidak valid",
})

const employeeSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Nama wajib diisi"),
  username: z.string().trim().min(1, "Username wajib diisi"),
  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .optional()
    .or(z.literal("")),
  role: z.nativeEnum(Role),
  departmentId: z.string().trim().min(1, "Departemen wajib dipilih"),
  position: z.string().trim().min(1, "Posisi wajib diisi"),
  joinedAt: isoDate,
  shift: z.nativeEnum(Shift),
})

const departmentSchema = z.object({
  id: z.string().optional(),
  name: z.nativeEnum(DepartmentName),
})

const leaveSchema = z.object({
  id: z.string().optional(),
  userId: z.string().trim().min(1, "Pegawai wajib dipilih"),
  type: z.nativeEnum(LeaveType),
  startDate: isoDate,
  endDate: isoDate,
  reason: z.string().trim().max(500).optional().or(z.literal("")),
})

function parse(formData: FormData): Record<string, string> {
  const entries: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    entries[key] = String(value)
  }
  return entries
}

export type ActionResult = { error?: string }

function listPath(path: string): never {
  redirect(path)
}

// ---------------------------------------------------------------- Employees

export async function upsertEmployee(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = employeeSchema.safeParse(parse(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" }
  }
  const d = parsed.data

  const clash = await prisma.user.findFirst({
    where: {
      username: d.username,
      ...(d.id ? { NOT: { id: d.id } } : {}),
    },
    select: { id: true },
  })
  if (clash) return { error: "Username sudah digunakan" }

  const common = {
    departmentId: d.departmentId,
    position: d.position,
    joinedAt: new Date(d.joinedAt),
    shift: d.shift,
  }

  if (d.id) {
    const exists = await prisma.user.findUnique({
      where: { id: d.id },
      select: { id: true },
    })
    if (!exists) return { error: "Data tidak ditemukan" }

    await prisma.user.update({
      where: { id: d.id },
      data: {
        name: d.name,
        username: d.username,
        role: d.role,
        ...(d.password ? { password: bcrypt.hashSync(d.password, 10) } : {}),
        ...common,
      },
    })
    listPath("/employees")
  }

  await prisma.user.create({
    data: {
      name: d.name,
      username: d.username,
      password: bcrypt.hashSync(d.password || "changeme123", 10),
      role: d.role,
      ...common,
    },
  })
  listPath("/employees")
}

export async function deleteEmployee(id: string) {
  try {
    await prisma.user.delete({ where: { id } })
  } catch {
    // masih ada relasi (check-in/cuti); abaikan agar halaman tidak crash
  }
  revalidatePath("/employees")
}

// -------------------------------------------------------------- Departments

export async function upsertDepartment(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const d = departmentSchema.safeParse(parse(formData))
  if (!d.success) return { error: d.error.issues[0]?.message ?? "Data tidak valid" }
  if (d.data.id) {
    await prisma.department.update({
      where: { id: d.data.id },
      data: { name: d.data.name },
    })
  } else {
    try {
      await prisma.department.create({ data: { name: d.data.name } })
    } catch {
      return { error: "Nama departemen sudah ada" }
    }
  }
  listPath("/departments")
}

export async function deleteDepartment(id: string) {
  try {
    await prisma.department.delete({ where: { id } })
  } catch {
    // masih dipakai employee; abaikan agar tidak crash
  }
  revalidatePath("/departments")
}

// -------------------------------------------------------------------- Leave

const toDate = (v: Date) =>
  new Date(Date.UTC(v.getFullYear(), v.getMonth(), v.getDate()))

export async function upsertLeave(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const data = leaveSchema.safeParse(parse(formData))
  if (!data.success) return { error: data.error.issues[0]?.message ?? "Data tidak valid" }
  const d = data.data
  const start = new Date(d.startDate)
  const end = new Date(d.endDate)
  if (end < start) return { error: "Tanggal akhir tidak boleh sebelum tanggal awal" }

  if (d.id) {
    await prisma.leave.update({
      where: { id: d.id },
      data: {
        type: d.type,
        startDate: toDate(start),
        endDate: toDate(end),
        reason: d.reason || null,
      },
    })
  } else {
    await prisma.leave.create({
      data: {
        userId: d.userId,
        type: d.type,
        startDate: toDate(start),
        endDate: toDate(end),
        reason: d.reason || null,
        status: "PENDING",
      },
    })
  }
  listPath("/leave")
}

export async function setLeaveStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  const status = String(formData.get("status") ?? "")
  if (id && (status === "APPROVED" || status === "REJECTED")) {
    await prisma.leave.update({ where: { id }, data: { status: status as LeaveStatus } })
  }
  revalidatePath("/leave")
}

export async function deleteLeave(id: string) {
  await prisma.leave.delete({ where: { id } })
  revalidatePath("/leave")
}

// -------------------------------------------------------------- Attendance

const checkInSchema = z.object({
  id: z.string().optional(),
  userId: z.string().trim().min(1, "Karyawan wajib dipilih"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  clockIn: z.string().min(1, "Jam masuk wajib diisi"),
  clockOut: z.string().optional().or(z.literal("")),
  status: z.nativeEnum(AttendanceStatus),
  lateMinutes: z.coerce.number().int().min(0).max(1440),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  effectiveShift: z.nativeEnum(Shift),
})

function toDateTime(value: string) {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export async function upsertCheckIn(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const d = checkInSchema.safeParse(parse(formData))
  if (!d.success) return { error: d.error.issues[0]?.message ?? "Data tidak valid" }
  const data = d.data

  const clockIn = toDateTime(data.clockIn)
  if (!clockIn) return { error: "Jam masuk tidak valid" }
  const clockOut = data.clockOut ? toDateTime(data.clockOut) : null
  if (data.clockOut && !clockOut) return { error: "Jam keluar tidak valid" }
  if (clockOut && clockOut < clockIn) {
    return { error: "Jam keluar tidak boleh sebelum jam masuk" }
  }

  const date = toDateTime(data.date)
  if (!date) return { error: "Tanggal tidak valid" }

  if (data.id) {
    const exists = await prisma.checkIn.findUnique({
      where: { id: data.id },
      select: { id: true },
    })
    if (!exists) return { error: "Data tidak ditemukan" }
    await prisma.checkIn.update({
      where: { id: data.id },
      data: {
        clockIn,
        clockOut,
        status: data.status,
        lateMinutes: data.lateMinutes,
        notes: data.notes || null,
      },
    })
  } else {
    try {
      await prisma.checkIn.create({
        data: {
          userId: data.userId,
          date,
          clockIn,
          clockOut,
          status: data.status,
          lateMinutes: data.lateMinutes,
          notes: data.notes || null,
          effectiveShift: data.effectiveShift,
        },
      })
    } catch {
      return { error: "Karyawan sudah memiliki kehadiran pada tanggal ini" }
    }
  }
  redirect(`/attendances?date=${data.date}`)
}

export async function deleteCheckIn(id: string, date: string) {
  if (!id) return
  await prisma.checkIn.delete({ where: { id } })
  revalidatePath("/attendances")
  redirect(`/attendances?date=${date}`)
}

const CHECKIN_SELECT = {
  id: true,
  userId: true,
  date: true,
  clockIn: true,
  clockOut: true,
  status: true,
  lateMinutes: true,
  notes: true,
  user: { select: { name: true } },
} as const

// Read-only list for the attendance manager. Called client-side.
export async function getAttendances(date: string, month: string | null) {
  const where = month
    ? (() => {
        const [y, m] = month.split("-").map(Number)
        return {
          date: { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) },
        }
      })()
    : (() => {
        const [y, m, d] = date.split("-").map(Number)
        return { date: new Date(Date.UTC(y, m - 1, d)) }
      })()

  const [checkIns, employees] = await Promise.all([
    prisma.checkIn.findMany({
      where,
      select: CHECKIN_SELECT,
      orderBy: month
        ? [{ date: "asc" }, { user: { name: "asc" } }]
        : [{ clockIn: "asc" }],
    }),
    prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return { checkIns, employees }
}

// -------------------------------------------------------------- Dashboard

export type DashboardStats = {
  totalEmployees: number
  present: number
  rate: number
  onLeave: number
  sick: number
  late: number
  lateAvg: number
}

function dayStartUTC(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  const parts = formatter.formatToParts(date)
  const y = Number(parts.find((p) => p.type === "year")?.value)
  const m = Number(parts.find((p) => p.type === "month")?.value)
  const d = Number(parts.find((p) => p.type === "day")?.value)
  return new Date(Date.UTC(y, m - 1, d))
}

// Read-only snapshot for the dashboard section cards. Called client-side.
export async function getDashboardStats(): Promise<DashboardStats> {
  const now = Date.now()
  const today = dayStartUTC()
  const todayEnd = dayStartUTC(new Date(now + 86_400_000))

  const [totalEmployees, todayCheckIns, todayLeaves] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.checkIn.findMany({
      where: { date: { gte: today, lt: todayEnd } },
      select: { status: true, lateMinutes: true },
    }),
    prisma.leave.findMany({
      where: {
        startDate: { lte: today },
        endDate: { gte: today },
        status: "APPROVED",
      },
      select: { type: true },
    }),
  ])

  const present = todayCheckIns.filter(
    (c) => c.status === "PRESENT" || c.status === "LATE"
  ).length
  const late = todayCheckIns.filter((c) => c.status === "LATE").length
  const onLeave = todayLeaves.length
  const sick = todayLeaves.filter((l) => l.type === "SICK").length
  const rate = totalEmployees
    ? Math.round((present / totalEmployees) * 1000) / 10
    : 0
  const lateAvg = todayCheckIns.length
    ? Math.round(
        todayCheckIns.reduce((s, c) => s + c.lateMinutes, 0) / todayCheckIns.length
      )
    : 0

  return { totalEmployees, present, rate, onLeave, sick, late, lateAvg }
}

export type TodayAttendanceRow = {
  id: string
  name: string
  imageUrl: string | null
  department: string | null
  clockIn: Date | null
  clockOut: Date | null
  status: string
  lateMinutes: number
}

// Today's check-ins for the dashboard table. Called client-side.
export async function getTodayAttendance(): Promise<TodayAttendanceRow[]> {
  const now = Date.now()
  const today = dayStartUTC()
  const todayEnd = dayStartUTC(new Date(now + 86_400_000))

  const checkIns = await prisma.checkIn.findMany({
    where: { date: { gte: today, lt: todayEnd } },
    select: {
      id: true,
      clockIn: true,
      clockOut: true,
      status: true,
      lateMinutes: true,
      user: {
        select: {
          name: true,
          imageUrl: true,
          department: { select: { name: true } },
        },
      },
    },
    orderBy: { clockIn: "desc" },
    take: 10,
  })

  return checkIns.map((c) => ({
    id: c.id,
    name: c.user.name,
    imageUrl: c.user.imageUrl,
    department: c.user.department?.name ?? null,
    clockIn: c.clockIn,
    clockOut: c.clockOut,
    status: c.status,
    lateMinutes: c.lateMinutes,
  }))
}