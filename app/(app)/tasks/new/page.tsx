import { prisma } from "@/lib/prisma";
import TaskForm from "@/components/TaskForm";
import { PageHeader } from "@/components/ui";

export default async function NewTaskPage() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader title="タスクを新規登録" />
      <TaskForm users={users} />
    </div>
  );
}
