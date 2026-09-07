"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, Input } from "@/components/ui";
import InlineEditItem from "@/components/InlineEditItem";

type Item = { id: string; name: string };
type CreateAction = (prevState: string | undefined, formData: FormData) => Promise<string | undefined>;

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "追加中..." : "追加"}
    </Button>
  );
}

export default function MasterListSection({
  items,
  createAction,
  updateAction,
  deleteAction,
  placeholder,
  deleteConfirmLabel,
  emptyLabel,
}: {
  items: Item[];
  createAction: CreateAction;
  updateAction: (id: string, name: string) => Promise<string | void>;
  deleteAction: (id: string) => Promise<void>;
  placeholder: string;
  deleteConfirmLabel: string;
  emptyLabel: string;
}) {
  const [error, formAction] = useActionState(createAction, undefined);

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-navy/10 rounded-lg border border-navy/10">
        {items.map((item) => (
          <InlineEditItem
            key={item.id}
            id={item.id}
            name={item.name}
            onSave={updateAction}
            onDelete={deleteAction}
            deleteConfirmMessage={`「${item.name}」を${deleteConfirmLabel}します。よろしいですか？`}
          />
        ))}
        {items.length === 0 && <li className="px-4 py-3 text-sm text-foreground/50">{emptyLabel}</li>}
      </ul>
      <form action={formAction} key={items.length} className="flex items-start gap-2">
        <Input name="name" placeholder={placeholder} required className="flex-1" />
        <AddButton />
      </form>
      {error && <p className="text-sm text-coral">{error}</p>}
    </div>
  );
}
