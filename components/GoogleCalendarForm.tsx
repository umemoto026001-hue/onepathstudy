"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Card, Field, Input } from "@/components/ui";
import { updateGoogleCalendarUrl } from "@/app/actions/profile";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "確認中..." : "保存する"}
    </Button>
  );
}

export default function GoogleCalendarForm({ currentUrl }: { currentUrl: string | null }) {
  const [error, formAction] = useActionState(updateGoogleCalendarUrl, undefined);

  return (
    <Card>
      <h2 className="mb-1 font-heading text-lg font-bold text-navy">Googleカレンダー連携</h2>
      <p className="mb-4 text-sm text-foreground/60">
        Googleカレンダーの予定を、ダッシュボードの本日のタイムテーブルに表示します（読み取り専用・自分の分のみ）。
        Googleカレンダーの設定画面 →「カレンダーの統合」→「非公開URL」（ics形式）をコピーして貼り付けてください。
        反映まで数十分〜数時間かかる場合があります（Google側の更新間隔によるため）。
      </p>
      <form action={formAction} className="space-y-4">
        <Field label="カレンダーのICS URL" htmlFor="googleCalendarIcsUrl" hint="空欄で保存すると連携を解除します">
          <Input
            id="googleCalendarIcsUrl"
            name="googleCalendarIcsUrl"
            type="url"
            placeholder="https://calendar.google.com/calendar/ical/.../private-xxxx/basic.ics"
            defaultValue={currentUrl ?? ""}
          />
        </Field>
        {error && (
          <p className="rounded-md bg-coral/10 px-3 py-2 text-sm text-coral" role="alert">
            {error}
          </p>
        )}
        <SubmitButton />
      </form>
    </Card>
  );
}
