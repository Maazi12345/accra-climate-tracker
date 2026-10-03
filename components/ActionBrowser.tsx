"use client";

// "use client" means this part runs in the visitor's browser, so the
// filter buttons and search box can react instantly. It only works on the
// action list it's given; it never fetches anything.

import { useMemo, useState } from "react";
import type { Action, Condition } from "@/lib/types";
import { ActionCard } from "./ActionCard";

interface Props {
  actions: Action[];
  active: Condition[]; // conditions happening right now
}

export function ActionBrowser({ actions, active }: Props) {
  const categories = useMemo(() => [...new Set(actions.map((a) => a.category))], [actions]);
  const [category, setCategory] = useState<string>("All");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const shown = actions.filter((a) => {
    if (category !== "All" && a.category !== category) return false;
    if (!q) return true;
    const text = [a.title, a.summary, a.category, ...a.details].join(" ").toLowerCase();
    return text.includes(q);
  });

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {["All", ...categories].map((c) => {
            const count = c === "All" ? actions.length : actions.filter((a) => a.category === c).length;
            const on = c === category;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={on}
                className={`rounded-full border px-3 py-1 text-sm ${
                  on ? "border-foreground bg-foreground text-background" : "border-line bg-card hover:border-foreground/40"
                }`}
              >
                {c} <span className="opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-2">
          <span className="sr-only">Search actions</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search, e.g. drain, 112, plastic"
            className="w-full rounded-full border border-line bg-card px-4 py-1.5 text-sm md:w-72"
          />
        </label>
      </div>

      <p className="mt-3 text-xs text-muted" aria-live="polite">
        Showing {shown.length} of {actions.length}
      </p>

      {shown.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
          No actions match that search. Try another word or pick &quot;All&quot;.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {shown.map((a) => {
            const tied = a.when.filter((w) => w !== "any");
            const dimmed = !a.when.includes("any") && !tied.some((w) => active.includes(w));
            return <ActionCard key={a.id} action={a} dimmed={dimmed} />;
          })}
        </div>
      )}
    </div>
  );
}
