import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { DepartmentName, Role, Shift } from "../generated/prisma/enums";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const PASSWORD = "admin123";

async function main() {
  // Departments
  const departments = Object.values(DepartmentName);
  for (const name of departments) {
    await prisma.department.upsert({ where: { name }, update: {}, create: { name } });
  }
  const departmentRows = await prisma.department.findMany();
  const departmentIdByName = Object.fromEntries(departmentRows.map((d) => [d.name, d.id]));

  // Wipe transactional data so re-running the seed is idempotent
  await prisma.leave.deleteMany({});
  await prisma.checkIn.deleteMany({});

  // Default accounts (stable logins)
  const defaultUsers = [
    {
      name: "Admin Zulzario",
      username: "ryotwell",
      role: Role.ADMIN,
      position: "Administrator",
      department: DepartmentName.PEOPLE_OPS,
      shift: Shift.FULLTIME,
    },
    {
      name: "Test Karyawan",
      username: "karyawan_test",
      role: Role.EMPLOYEE,
      position: "Sales",
      department: DepartmentName.SALES,
      shift: Shift.PAGI,
    },
  ];

  const defaultUsernames = new Set(defaultUsers.map((u) => u.username));
  await prisma.user.deleteMany({ where: { username: { notIn: [...defaultUsernames] } } });

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const users: {
    id: string;
    name: string;
    username: string;
    role: Role;
    position: string | null;
    isActive: boolean;
  }[] = [];

  for (const u of defaultUsers) {
    users.push(
      await prisma.user.upsert({
        where: { username: u.username },
        update: {
          shift: u.shift,
        },
        create: {
          name: u.name,
          username: u.username,
          password: passwordHash,
          role: u.role,
          position: u.position,
          joinedAt: new Date(),
          departmentId: departmentIdByName[u.department],
          shift: u.shift,
        },
      }),
    );
  }
  console.log(`Seeded ${users.length} users`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());