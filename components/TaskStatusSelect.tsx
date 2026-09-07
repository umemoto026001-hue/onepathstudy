"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TaskStatus } from "@prisma/client";
import { Select } from "@/components/ui";
import { TASK_STATUS_LABEL } from "@/lib/labels";
import { updateTaskStatus } from "@/app/actions/tasks";

export default function TaskStatusSelect({ id, status }: { id: string; status: TaskStatus }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          await updateTaskStatus(id, next);
          router.refresh();
        });
      }}
      className="!w-auto"
    >
      {Object.entries(TASK_STATUS_LABEL).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </Select>
  );
}
