"use client";

import { useState, useTransition } from "react";
import { Button, Input } from "@/components/ui";

export default function InlineEditItem({
  id,
  name,
  onSave,
  onDelete,
  deleteConfirmMessage,
}: {
  id: string;
  name: string;
  onSave: (id: string, name: string) => Promise<string | void>;
  onDelete: (id: string) => Promise<void>;
  deleteConfirmMessage: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className="flex items-center gap-2 px-4 py-2.5">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1"
          autoFocus
        />
        <Button
          type="button"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await onSave(id, value);
              setEditing(false);
            });
          }}
        >
          保存
        </Button>
        <button
          type="button"
          onClick={() => {
            setValue(name);
            setEditing(false);
          }}
          className="text-sm text-navy/60 underline"
        >
          キャンセル
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 px-4 py-2.5">
      <span>{name}</span>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setEditing(true)} className="text-sm text-navy underline">
          編集
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (confirm(deleteConfirmMessage)) {
              startTransition(async () => {
                try {
                  await onDelete(id);
                } catch (error) {
                  alert(error instanceof Error ? error.message : "削除に失敗しました。");
                }
              });
            }
          }}
          className="text-sm text-coral underline"
        >
          削除
        </button>
      </div>
    </li>
  );
}
