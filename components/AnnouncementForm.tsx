"use client";

import { useActionState } from "react";
import type { Campus, Class, Subject } from "@prisma/client";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui";
import { sendAnnouncement } from "@/app/actions/announcements";

type ClassWithSubject = Class & { subject: Subject };

export default function AnnouncementForm({
  campuses,
  classes,
}: {
  campuses: Campus[];
  classes: ClassWithSubject[];
}) {
  const [error, formAction, isPending] = useActionState(sendAnnouncement, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const form = e.currentTarget;
        const title = (form.elements.namedItem("title") as HTMLInputElement)?.value;
        if (!confirm(`「${title}」を送信します。よろしいですか？（この操作は取り消せません）`)) {
          e.preventDefault();
        }
      }}
      className="space-y-6"
    >
      <Card className="grid gap-4 sm:grid-cols-2">
        <Field label="件名" htmlFor="title" required>
          <Input id="title" name="title" required />
        </Field>
        {campuses.length > 0 && (
          <Field label="校舎" htmlFor="campusId" hint="クラスを指定した場合はこの指定は無視されます">
            <Select id="campusId" name="campusId" defaultValue="">
              <option value="">全校舎</option>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="クラス（任意）" htmlFor="classId" hint="指定するとそのクラスの在籍生徒のみに送信します">
          <Select id="classId" name="classId" defaultValue="">
            <option value="">指定しない</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}（{c.subject.name}）
              </option>
            ))}
          </Select>
        </Field>
      </Card>
      <Card>
        <Field label="本文" htmlFor="content" required>
          <Textarea id="content" name="content" rows={6} required />
        </Field>
      </Card>
      {error && (
        <p className="rounded-md bg-coral/10 px-3 py-2 text-sm text-coral" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={isPending}>
        {isPending ? "送信中..." : "送信する"}
      </Button>
    </form>
  );
}
