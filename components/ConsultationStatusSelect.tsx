"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ConsultationStatus } from "@prisma/client";
import { Select } from "@/components/ui";
import { CONSULTATION_STATUS_LABEL } from "@/lib/labels";
import { updateConsultationStatus } from "@/app/actions/consultations";

export default function ConsultationStatusSelect({
  id,
  status,
}: {
  id: string;
  status: ConsultationStatus;
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
          await updateConsultationStatus(id, next);
          router.refresh();
        });
      }}
      className="!w-auto"
    >
      {Object.entries(CONSULTATION_STATUS_LABEL).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </Select>
  );
}
