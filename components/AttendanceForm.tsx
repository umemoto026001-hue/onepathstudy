"use client";

import { useFormStatus } from "react-dom";
import type { AttendanceStatus, Student } from "@prisma/client";
import { Button, Input, Select } from "@/components/ui";
import { ATTENDANCE_STATUS_LABEL } from "@/lib/labels";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "保存中..." : "出欠を保存する"}
    </Button>
  );
}

export default function AttendanceForm({
  action,
  students,
  existing,
}: {
  action: (formData: FormData) => void;
  students: Student[];
  existing: Map<string, { status: AttendanceStatus; note: string | null }>;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-navy/10">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-navy/5 text-xs uppercase text-navy/60">
            <tr>
              <th className="px-4 py-2">生徒</th>
              <th className="px-4 py-2">出欠</th>
              <th className="px-4 py-2">メモ</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const record = existing.get(s.id);
              return (
                <tr key={s.id} className="border-t border-navy/10">
                  <td className="px-4 py-2">
                    {s.name}
                    <span className="ml-1 font-mono text-xs text-foreground/40">{s.studentNumber}</span>
                  </td>
                  <td className="px-4 py-2">
                    <Select name={`status__${s.id}`} defaultValue={record?.status ?? "PRESENT"} className="!w-auto">
                      {Object.entries(ATTENDANCE_STATUS_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
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
