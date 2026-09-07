"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ScheduleStatus } from "@prisma/client";
import { Select } from "@/components/ui";
import { SCHEDULE_STATUS_LABEL } from "@/lib/labels";
import { updateScheduleStatus } from "@/app/actions/schedule";

export default function ScheduleStatusSelect({
  id,
  status,
}: {
  id: string;
  status: ScheduleStatus;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Select
      value={status}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value;
        startTransition(async () => {
          await updateScheduleStatus(id, next);
          router.refresh();
        });
      }}
    >
      {Object.entries(SCHEDULE_STATUS_LABEL).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </Select>
  );
}
