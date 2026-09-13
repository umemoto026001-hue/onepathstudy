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
import type { Prisma, Task, User } from "@prisma/client";

type TaskWithRelations = Task & { assignee: User; creator: User };
type TabName = "tasks" | "done" | "consultations";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab: TabName = tab === "consultations" ? "consultations" : tab === "done" ? "done" : "tasks";

  const session = await auth();
  const userId = session!.user.id;
  const role = session!.user.role as "TEACHER" | "STAFF" | "HQ" | "EXECUTIVE";
  const seeAll = canViewAll(role);

  if (activeTab === "tasks" || activeTab === "done") {
    // 個人宛タスクは依頼人・担当者以外には表示しない（役員・本部社員も例外なし）。
    const tasks = await prisma.task.findMany({
      where: {
        OR: [{ assigneeId: userId }, { creatorId: userId }],
        status: activeTab === "done" ? "DONE" : { not: "DONE" },
      },
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
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isUnread={unreadIds.includes(task.id)}
              canEdit={task.creatorId === userId}
            />
          ))}
          {tasks.length === 0 && (
            <Card className="py-8 text-center text-foreground/50">
              {activeTab === "done" ? "完了済みのタスクはありません。" : "タスクはありません。"}
            </Card>
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

function TaskCard({
  task,
  isUnread,
  canEdit,
}: {
  task: TaskWithRelations;
  isUnread: boolean;
  canEdit: boolean;
}) {
  return (
    <Card className={clsx(isUnread && "border-coral/50 bg-coral/5")}>
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
            {task.scheduledDate && task.slotStart && task.slotEnd && (
              <>
                {" "}
                ・ 配置: {formatDate(task.scheduledDate)} {task.slotStart}〜{task.slotEnd}
              </>
            )}
          </p>
          {task.description && <p className="mt-2 whitespace-pre-wrap text-sm">{task.description}</p>}
          {canEdit && (
            <Link href={`/tasks/${task.id}/edit`} className="mt-2 inline-block text-xs text-navy underline">
              編集
            </Link>
          )}
        </div>
        <TaskStatusSelect id={task.id} status={task.status} />
      </div>
    </Card>
  );
}

function Tabs({ active }: { active: TabName }) {
  const tabs: { key: TabName; label: string; href: string }[] = [
    { key: "tasks", label: "個人宛タスク", href: "/tasks?tab=tasks" },
    { key: "done", label: "完了済み", href: "/tasks?tab=done" },
    { key: "consultations", label: "相談・クレーム", href: "/tasks?tab=consultations" },
  ];
  return (
    <div className="flex flex-wrap gap-1 rounded-full bg-navy/5 p-1">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={clsx(
            "rounded-full px-4 py-1.5 text-sm font-medium",
            active === t.key ? "bg-white shadow-sm text-navy" : "text-navy/60",
          )}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}
