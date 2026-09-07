"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Problem, Subject } from "@prisma/client";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { DIFFICULTY_LABEL } from "@/lib/labels";

type Action = (
  prevState: string | undefined,
  formData: FormData,
) => Promise<string | undefined>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "保存中..." : label}
    </Button>
  );
}

export default function ProblemForm({
  action,
  subjects,
  universities,
  problem,
  submitLabel,
  onCancelHref,
}: {
  action: Action;
  subjects: Subject[];
  universities: { id: string; name: string }[];
  problem?: Problem;
  submitLabel: string;
  onCancelHref?: string;
}) {
  const [error, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <Card className="grid gap-4 sm:grid-cols-2">
        <Field label="タイトル" htmlFor="title" required>
          <Input id="title" name="title" required defaultValue={problem?.title} />
        </Field>
        <Field label="科目" htmlFor="subjectId" required>
          <Select id="subjectId" name="subjectId" required defaultValue={problem?.subjectId ?? ""}>
            <option value="" disabled>
              選択してください
            </option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="大学" htmlFor="university">
          <Input
            id="university"
            name="university"
            list="university-options"
            defaultValue={problem?.university ?? ""}
          />
          <datalist id="university-options">
            {universities.map((u) => (
              <option key={u.id} value={u.name} />
            ))}
          </datalist>
        </Field>
        <Field label="難易度" htmlFor="difficulty">
          <Select id="difficulty" name="difficulty" defaultValue={problem?.difficulty ?? ""}>
            <option value="">未設定</option>
            {Object.entries(DIFFICULTY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="単元・キーワード"
          htmlFor="unit"
          required
          hint="カンマ区切りで複数入力できます（例: 微分, 極値, 大阪公立大）"
        >
          <Input id="unit" name="unit" required defaultValue={problem?.unit ?? ""} />
        </Field>
      </Card>

      <Card>
        <Field label="問題文" htmlFor="problemText" required>
          <Textarea id="problemText" name="problemText" rows={8} required defaultValue={problem?.problemText ?? ""} />
        </Field>
      </Card>

      <Card>
        <Field
          label="方針"
          htmlFor="houshin"
          hint="この分野で使われる主な方針を列挙し、今回選ぶ方針を明示してください"
        >
          <Textarea id="houshin" name="houshin" rows={5} defaultValue={problem?.houshin ?? ""} />
        </Field>
      </Card>

      <Card>
        <Field label="解答" htmlFor="kaitou">
          <Textarea id="kaitou" name="kaitou" rows={6} defaultValue={problem?.kaitou ?? ""} />
        </Field>
      </Card>

      <Card>
        <Field
          label="解説"
          htmlFor="kaisetsu"
          hint="方針を選ぶ理由、他の方針との比較、時間配分などを記載してください"
        >
          <Textarea id="kaisetsu" name="kaisetsu" rows={6} defaultValue={problem?.kaisetsu ?? ""} />
        </Field>
      </Card>

      {error && (
        <p className="rounded-md bg-coral/10 px-3 py-2 text-sm text-coral" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <SubmitButton label={submitLabel} />
        {onCancelHref && (
          <a
            href={onCancelHref}
            className="inline-flex items-center justify-center rounded-lg border border-navy/20 px-4 py-2.5 text-sm font-bold text-navy hover:bg-navy/5"
          >
            キャンセル
          </a>
        )}
      </div>
    </form>
  );
}
