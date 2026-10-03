import type { Action } from "@/lib/types";
import { CONDITION_LABELS } from "@/lib/conditions";

interface Props {
  action: Action;
  reasons?: string[]; // why it's in "What to do today"
  dimmed?: boolean; // tied to a condition that isn't happening now
}

export function ActionCard({ action, reasons, dimmed }: Props) {
  const tags = action.when.filter((w) => w !== "any");
  return (
    <article
      className={`flex flex-col gap-3 rounded-2xl border bg-card p-5 transition-opacity ${
        reasons ? "border-accent/50" : "border-line"
      } ${dimmed ? "opacity-60" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-foreground/5 px-2.5 py-0.5 font-semibold">{action.category}</span>
        {(tags.length ? tags : ["any" as const]).map((t) => (
          <span key={t} className="rounded-full border border-line px-2.5 py-0.5 text-muted">
            {CONDITION_LABELS[t]}
          </span>
        ))}
      </div>

      {reasons && reasons.length > 0 && (
        <p className="text-xs font-semibold text-accent">Because: {reasons.join(" · ")}</p>
      )}

      <h3 className="text-lg font-semibold leading-snug">{action.title}</h3>
      <p className="text-sm text-muted">{action.summary}</p>

      <ul className="list-disc space-y-1 pl-5 text-sm">
        {action.details.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-1 pt-2 text-xs">
        {action.sources.map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">
            {s.title}
          </a>
        ))}
        <span className="text-muted">Checked {action.verification.lastChecked}</span>
      </div>
    </article>
  );
}
