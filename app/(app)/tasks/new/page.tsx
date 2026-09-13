import { prisma } from "@/lib/prisma";
import TaskForm from "@/components/TaskForm";
import { PageHeader } from "@/components/ui";
import { createTask } from "@/app/actions/tasks";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ assigneeId?: string; date?: string; start?: string; end?: string }>;
}) {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const { assigneeId, date, start, end } = await searchParams;

  return (
    <div>
      <PageHeader title="タスクを新規登録" />
      <TaskForm
        action={createTask}
        users={users}
        defaults={{ assigneeId, scheduledDate: date, slotStart: start, slotEnd: end }}
        onCancelHref="/tasks"
      />
    </div>
  );
}
