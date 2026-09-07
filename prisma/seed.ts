import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SUBJECTS = ["英語", "数学", "物理", "化学"];
const CAMPUSES = ["オンライン校"];

const EMPLOYEES: {
  name: string;
  employeeNumber: string;
  role: "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE";
  email?: string;
}[] = [
  { name: "梅本隼人", employeeNumber: "026001", role: "EXECUTIVE", email: "umemoto026001@onepathstudy.com" },
  { name: "木村朝陽", employeeNumber: "026002", role: "EXECUTIVE" },
  { name: "宮坂優里", employeeNumber: "026003", role: "HQ" },
];

async function main() {
  for (const name of SUBJECTS) {
    await prisma.subject.upsert({ where: { name }, update: {}, create: { name } });
  }

  const campuses = new Map<string, string>();
  for (const name of CAMPUSES) {
    const campus = await prisma.campus.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    campuses.set(name, campus.id);
  }
  const defaultCampusId = campuses.get(CAMPUSES[0]);

  const initialPasswordHash = await bcrypt.hash("onepath", 10);

  for (const employee of EMPLOYEES) {
    await prisma.user.upsert({
      where: { employeeNumber: employee.employeeNumber },
      // email だけは既存レコードにも反映する（他のフィールドは /settings での
      // 変更を尊重し、シード再実行では上書きしない）。
      update: { email: employee.email },
      create: {
        name: employee.name,
        employeeNumber: employee.employeeNumber,
        role: employee.role,
        email: employee.email,
        passwordHash: initialPasswordHash,
        mustChangePassword: true,
        campusId: defaultCampusId,
      },
    });
  }

  console.log("Seed data created. 初期パスワードは全員共通で「onepath」（初回ログイン時に変更必須）");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
