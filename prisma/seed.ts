import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SUBJECTS = ["英語", "数学", "物理", "化学"];

const UNIVERSITIES = [
  "東京都立大学",
  "横浜国立大学",
  "埼玉大学",
  "静岡大学",
  "三重大学",
  "富山大学",
  "大阪公立大学",
  "兵庫県立大学",
  "広島大学",
];

async function main() {
  const subjects = new Map<string, string>();
  for (const name of SUBJECTS) {
    const subject = await prisma.subject.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    subjects.set(name, subject.id);
  }

  for (const name of UNIVERSITIES) {
    await prisma.university.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const devPassword = await bcrypt.hash("onepath2027", 10);

  await prisma.user.upsert({
    where: { email: "umemoto@onepathstudy.com" },
    update: {},
    create: {
      name: "梅本隼人",
      email: "umemoto@onepathstudy.com",
      passwordHash: devPassword,
      role: "ADMIN",
      subjects: {
        connect: [{ id: subjects.get("英語") }, { id: subjects.get("化学") }],
      },
    },
  });

  await prisma.user.upsert({
    where: { email: "kimura@onepathstudy.com" },
    update: {},
    create: {
      name: "木村朝陽",
      email: "kimura@onepathstudy.com",
      passwordHash: devPassword,
      role: "ADMIN",
      subjects: {
        connect: [{ id: subjects.get("数学") }, { id: subjects.get("物理") }],
      },
    },
  });

  console.log("Seed data created. Dev login password for both users: onepath2027");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
