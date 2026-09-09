import Link from "next/link";
import clsx from "clsx";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, LinkButton, PageHeader } from "@/components/ui";
import { CONSULTATION_STATUS_BADGE, CONSULTATION_STATUS_LABEL, TASK_STATUS_BADGE, TASK_STATUS_LABEL } from "@/lib/labels";
import { canManageConsultationStatus, canViewAll } from "@/lib/permissions";
import { formatDate, formatDateTime } from "@/lib/date";
import { markTasksRead } from "@/app/actions/tasks";
import { markConsultationsRead } from "@/app/actions/consultations";
import TaskStatusSelect from "@/components/TaskStatusSelect";
import ConsultationStatusSelect from "@/components/ConsultationStatusSelect";
import type { Prisma } from "@prisma/client";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = tab === "consultations" ? "consultations" : "tasks";

  const session = await auth();
  const userId = session!.user.id;
  const role = session!.user.role as "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE";
  const seeAll = canViewAll(role);

  if (activeTab === "tasks") {
    // 個人宛タスクは依頼人・担当者以外には表示しない（役員・本部社員も例外なし）。
    const tasks = await prisma.task.findMany({
      where: { OR: [{ assigneeId: userId }, { creatorId: userId }] },
      include: { assignee: true, creator: true },
      orderBy: [{ createdAt: "desc" }],
    });

    const unreadIds = tasks
      .filter((t) => t.assigneeId === userId && !t.isRead)
      .map((t) => t.id);
    await markTasksRead(unreadIds);

    return (
      <div>
        <PageHeader
          title="タスク・相談"
          actions={<LinkButton href="/tasks/new">+ タスクを登録する</LinkButton>}
        />
        <Tabs active={activeTab} />
        <div className="mt-4 space-y-3">
          {tasks.map((task) => {
            const isUnread = unreadIds.includes(task.id);
            return (
              <Card key={task.id} className={clsx(isUnread && "border-coral/50 bg-coral/5")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isUnread && <span className="h-2 w-2 rounded-full bg-coral" aria-label="未読" />}
                      <span className="font-heading font-bold text-navy">{task.title}</span>
                      <Badge color={TASK_STATUS_BADGE[task.status]}>{TASK_STATUS_LABEL[task.status]}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-foreground/50">
                      担当: {task.assignee.name} ・ 依頼: {task.creator.name}
                      {task.dueDate && <> ・ 期限: {formatDate(task.dueDate)}</>}
                    </p>
                    {task.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm">{task.description}</p>
                    )}
                  </div>
                  <TaskStatusSelect id={task.id} status={task.status} />
                </div>
              </Card>
            );
          })}
          {tasks.length === 0 && (
            <Card className="py-8 text-center text-foreground/50">タスクはありません。</Card>
          )}
        </div>
      </div>
    );
  }

  const where: Prisma.ConsultationWhereInput = seeAll
    ? {}
    : { OR: [{ posterId: userId }, { assigneeId: userId }] };

  const consultations = await prisma.consultation.findMany({
    where,
    include: { poster: true, assignee: true, student: true },
    orderBy: [{ createdAt: "desc" }],
  });

  const unreadIds = consultations
    .filter((c) => c.assigneeId === userId && !c.isRead)
    .map((c) => c.id);
  await markConsultationsRead(unreadIds);

  return (
    <div>
      <PageHeader
        title="タスク・相談"
        actions={<LinkButton href="/consultations/new">+ 相談を投稿する</LinkButton>}
      />
      <Tabs active={activeTab} />
      <div className="mt-4 space-y-3">
        {consultations.map((c) => {
          const isUnread = unreadIds.includes(c.id);
          const canEdit = canManageConsultationStatus(role, c.assigneeId === userId);
          return (
            <Card key={c.id} className={clsx(isUnread && "border-coral/50 bg-coral/5")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {isUnread && <span className="h-2 w-2 rounded-full bg-coral" aria-label="未読" />}
                    <span className="font-heading font-bold text-navy">{c.title}</span>
                    <Badge color={CONSULTATION_STATUS_BADGE[c.status]}>
                      {CONSULTATION_STATUS_LABEL[c.status]}
                    </Badge>
                    {c.student && <Badge color="gold">{c.student.name}</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-foreground/50">
                    投稿: {c.poster.name} ・ 担当: {c.assignee.name} ・ {formatDateTime(c.createdAt)}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{c.content}</p>
                </div>
                {canEdit ? (
                  <ConsultationStatusSelect id={c.id} status={c.status} />
                ) : (
                  <Badge color={CONSULTATION_STATUS_BADGE[c.status]}>{CONSULTATION_STATUS_LABEL[c.status]}</Badge>
                )}
              </div>
            </Card>
          );
        })}
        {consultations.length === 0 && (
          <Card className="py-8 text-center text-foreground/50">相談・クレームはありません。</Card>
        )}
      </div>
    </div>
  );
}

function Tabs({ active }: { active: "tasks" | "consultations" }) {
  return (
    <div className="flex gap-1 rounded-full bg-navy/5 p-1">
      <Link
        href="/tasks?tab=tasks"
        className={clsx(
          "rounded-full px-4 py-1.5 text-sm font-medium",
          active === "tasks" ? "bg-white shadow-sm text-navy" : "text-navy/60",
        )}
      >
        個人宛タスク
      </Link>
      <Link
        href="/tasks?tab=consultations"
        className={clsx(
          "rounded-full px-4 py-1.5 text-sm font-medium",
          active === "consultations" ? "bg-white shadow-sm text-navy" : "text-navy/60",
        )}
      >
        相談・クレーム
      </Link>
    </div>
  );
}
