"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { WorkShift } from "@prisma/client";
import { Button, Card, Field, Input } from "@/components/ui";
import { WEEKDAY_LABEL, WEEKDAY_ORDER } from "@/lib/labels";

type Action = (
  prevState: string | undefined,
  formData: FormData,
) => Promise<string | undefined>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "保存中..." : "保存する"}
    </Button>
  );
}

export default function ShiftForm({
  action,
  shifts,
  onCancelHref,
}: {
  action: Action;
  shifts: WorkShift[];
  onCancelHref: string;
}) {
  const [error, formAction] = useActionState(action, undefined);
  const shiftByWeekday = Object.fromEntries(shifts.map((s) => [s.weekday, s]));

  return (
    <form action={formAction} className="space-y-4">
      <Card className="space-y-3">
        <p className="text-sm text-foreground/60">
          出勤する曜日だけ開始・終了時刻を入力してください。空欄のままの曜日は「休み」として扱われます。
        </p>
        {WEEKDAY_ORDER.map((weekday) => {
          const shift = shiftByWeekday[weekday];
          return (
            <div key={weekday} className="grid grid-cols-[3rem_1fr_1fr] items-end gap-3">
              <span className="pb-2.5 font-heading font-bold text-navy">{WEEKDAY_LABEL[weekday]}</span>
              <Field label="開始時刻" htmlFor={`start_${weekday}`}>
                <Input
                  id={`start_${weekday}`}
                  name={`start_${weekday}`}
                  type="time"
                  defaultValue={shift?.startTime ?? ""}
                />
              </Field>
              <Field label="終了時刻" htmlFor={`end_${weekday}`}>
                <Input
                  id={`end_${weekday}`}
                  name={`end_${weekday}`}
                  type="time"
                  defaultValue={shift?.endTime ?? ""}
                />
              </Field>
            </div>
          );
        })}
      </Card>

      {error && (
        <p className="rounded-md bg-coral/10 px-3 py-2 text-sm text-coral" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <SubmitButton />
        <a
          href={onCancelHref}
          className="inline-flex items-center justify-center rounded-lg border border-navy/20 px-4 py-2.5 text-sm font-bold text-navy hover:bg-navy/5"
        >
          キャンセル
        </a>
      </div>
    </form>
  );
}
