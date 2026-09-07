import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import { CLASS_MODE_LABEL, WEEKDAY_LABEL, WEEKDAY_ORDER } from "@/lib/labels";
import { canManageClasses } from "@/lib/permissions";
import { classAccessWhere } from "@/lib/classAccess";

export default async function ClassesPage() {
  const session = await auth();
  const role = session!.user.role as "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE";

  const where = classAccessWhere(role, session!.user.id, session!.user.campusId);

  const classes = await prisma.class.findMany({
    where,
    include: { subject: true, teacher: true, campus: true, _count: { select: { enrollments: true } } },
    orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
  });

  const byWeekday = new Map<string, typeof classes>();
  for (const c of classes) {
    byWeekday.set(c.weekday, [...(byWeekday.get(c.weekday) ?? []), c]);
  }

  return (
    <div>
      <PageHeader
        title="クラス・授業スケジュール"
        description={`${classes.length}件`}
        actions={canManageClasses(role) ? <LinkButton href="/classes/new">+ クラスを登録する</LinkButton> : undefined}
      />

      <div className="space-y-4">
        {WEEKDAY_ORDER.filter((w) => byWeekday.has(w)).map((weekday) => (
          <Card key={weekday}>
            <h2 className="mb-3 font-heading text-lg font-bold text-navy">{WEEKDAY_LABEL[weekday]}曜日</h2>
            <ul className="space-y-2">
              {byWeekday.get(weekday)!.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/classes/${c.id}`}
                    className="flex flex-wrap items-center gap-2 rounded-lg bg-navy/5 px-3 py-2 text-sm hover:bg-navy/10"
                  >
                    <span className="font-medium text-navy">
                      {c.startTime}〜{c.endTime}
                    </span>
                    <span className="font-medium">{c.name}</span>
                    <Badge>{c.subject.name}</Badge>
                    <Badge color="gold">{c.level}</Badge>
                    <Badge color={c.mode === "ONLINE" ? "navy" : "green"}>{CLASS_MODE_LABEL[c.mode]}</Badge>
                    <span className="text-xs text-foreground/50">
                      担当: {c.teacher.name} ・ {c._count.enrollments}名
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ))}
        {classes.length === 0 && (
          <Card className="py-8 text-center text-foreground/50">クラスはまだありません。</Card>
        )}
      </div>
    </div>
  );
}
