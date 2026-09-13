import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import TaskForm from "@/components/TaskForm";
import { PageHeader } from "@/components/ui";
import { updateTask } from "@/app/actions/tasks";
import { canEditTask } from "@/lib/permissions";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) notFound();
  if (!canEditTask(task.creatorId === session!.user.id)) {
    redirect("/tasks");
  }

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader title="タスクを編集" />
      <TaskForm action={updateTask.bind(null, task.id)} users={users} task={task} submitLabel="更新する" onCancelHref="/tasks" />
    </div>
  );
}
