"use client";

import { useFormStatus } from "react-dom";
import clsx from "clsx";
import type { Student } from "@prisma/client";
import { Badge, Button, Input } from "@/components/ui";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "保存中..." : "提出状況を保存する"}
    </Button>
  );
}

export default function SubmissionForm({
  action,
  students,
  existing,
}: {
  action: (formData: FormData) => void;
  students: Student[];
  existing: Map<string, { submitted: boolean; note: string | null }>;
}) {
  const notSubmittedCount = students.filter((s) => !existing.get(s.id)?.submitted).length;

  return (
    <form action={action} className="space-y-4">
      {students.length > 0 && (
        <p className="text-sm text-foreground/60">
          未提出: <span className="font-bold text-coral">{notSubmittedCount}</span> / {students.length}名
        </p>
      )}
      <div className="overflow-x-auto rounded-xl border border-navy/10">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-navy/5 text-xs uppercase text-navy/60">
            <tr>
              <th className="px-4 py-2">生徒</th>
              <th className="px-4 py-2">提出</th>
              <th className="px-4 py-2">メモ</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const record = existing.get(s.id);
              const submitted = record?.submitted ?? false;
              return (
                <tr key={s.id} className={clsx("border-t border-navy/10", !submitted && "bg-coral/5")}>
                  <td className="px-4 py-2">
                    {s.name}
                    <span className="ml-1 font-mono text-xs text-foreground/40">{s.studentNumber}</span>
                  </td>
                  <td className="px-4 py-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name={`submitted__${s.id}`}
                        defaultChecked={submitted}
                        className="h-4 w-4 accent-coral"
                      />
                      {submitted ? (
                        <Badge color="green">提出済み</Badge>
                      ) : (
                        <Badge color="coral">未提出</Badge>
                      )}
                    </label>
                  </td>
                  <td className="px-4 py-2">
                    <Input name={`note__${s.id}`} defaultValue={record?.note ?? ""} />
                  </td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-foreground/50">
                  所属生徒がいません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {students.length > 0 && <SubmitButton />}
    </form>
  );
}
