"use client";

import { useEffect, useRef, useState } from "react";
import { Badge, Input } from "@/components/ui";

type ProblemHit = {
  id: string;
  title: string;
  subjectName: string;
  university: string | null;
};

export default function ProblemPicker({
  initialSelected = [],
}: {
  initialSelected?: ProblemHit[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProblemHit[]>([]);
  const [selected, setSelected] = useState<ProblemHit[]>(initialSelected);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (!trimmed) return;
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/problems/search?q=${encodeURIComponent(trimmed)}`);
      if (!res.ok) return;
      const data = await res.json();
      setResults(data.problems as ProblemHit[]);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const selectedIds = new Set(selected.map((p) => p.id));
  const visibleResults = query.trim() ? results : [];

  return (
    <div className="space-y-2">
      <Input
        placeholder="タイトル・単元・大学名で検索"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {visibleResults.length > 0 && (
        <ul className="max-h-56 divide-y divide-navy/10 overflow-y-auto rounded-lg border border-navy/15 bg-white">
          {visibleResults.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <div>
                <span className="font-medium">{p.title}</span>{" "}
                <span className="text-xs text-foreground/50">
                  {p.subjectName}
                  {p.university ? ` ・ ${p.university}` : ""}
                </span>
              </div>
              <button
                type="button"
                disabled={selectedIds.has(p.id)}
                onClick={() => setSelected((prev) => [...prev, p])}
                className="shrink-0 rounded-full bg-coral px-2.5 py-1 text-xs font-bold text-white disabled:opacity-40"
              >
                {selectedIds.has(p.id) ? "追加済み" : "+ 追加"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-1.5">
        {selected.map((p) => (
          <span key={p.id}>
            <input type="hidden" name="problemIds" value={p.id} />
            <Badge color="gold">
              {p.title}
              <button
                type="button"
                onClick={() => setSelected((prev) => prev.filter((s) => s.id !== p.id))}
                className="ml-1.5 text-[#8a6a30] hover:text-coral"
                aria-label={`${p.title}を削除`}
              >
                ×
              </button>
            </Badge>
          </span>
        ))}
        {selected.length === 0 && (
          <p className="text-xs text-foreground/40">使用した演習問題を検索して追加してください（任意）。</p>
        )}
      </div>
    </div>
  );
}
