"use client";

import type { Student } from "@prisma/client";
import { Button, Checkbox } from "@/components/ui";
import { updateEnrollment } from "@/app/actions/classes";

export default function EnrollmentForm({
  classId,
  students,
  enrolledStudentIds,
}: {
  classId: string;
  students: Student[];
  enrolledStudentIds: string[];
}) {
  const enrolledSet = new Set(enrolledStudentIds);

  return (
    <form action={updateEnrollment.bind(null, classId)} className="space-y-3">
      <div className="flex max-h-72 flex-wrap gap-2 overflow-y-auto">
        {students.map((s) => (
          <Checkbox
            key={s.id}
            name="studentIds"
            value={s.id}
            label={`${s.name}（${s.studentNumber}）`}
            defaultChecked={enrolledSet.has(s.id)}
          />
        ))}
        {students.length === 0 && (
          <p className="text-sm text-foreground/50">在籍中の生徒がいません。</p>
        )}
      </div>
      <Button type="submit">所属生徒を更新する</Button>
    </form>
  );
}
