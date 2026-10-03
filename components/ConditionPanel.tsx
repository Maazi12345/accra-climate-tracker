import type { Level, Panel } from "@/lib/conditions";

// One colour per level. The colours themselves live in app/globals.css.
// The colour shows in the bar across the top and the dot in the badge;
// the badge text stays dark so it's easy to read on any level.
const LEVEL_COLOUR: Record<Level, string> = {
  good: "bg-level-good",
  moderate: "bg-level-moderate",
  high: "bg-level-high",
  extreme: "bg-level-extreme",
  unknown: "bg-muted/40",
};

const LEVEL_NAMES: Record<Level, string> = {
  good: "Good",
  moderate: "Moderate",
  high: "High",
  extreme: "Extreme",
  unknown: "No data",
};

export function ConditionPanel({ panel }: { panel: Panel }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-sm">
      <div className={`h-2 ${LEVEL_COLOUR[panel.level]}`} aria-hidden="true" />
      <div className="flex flex-1 flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted">{panel.label}</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 text-xs font-semibold">
          <span className={`h-2.5 w-2.5 rounded-full ${LEVEL_COLOUR[panel.level]}`} aria-hidden="true" />
          {LEVEL_NAMES[panel.level]}
        </span>
      </div>
      <p className="flex items-baseline gap-2">
        <span className="text-5xl font-bold tracking-tight">{panel.value}</span>
        <span className="text-sm text-muted">{panel.unit}</span>
      </p>
      <p className="text-lg font-medium">{panel.headline}</p>
      <p className="text-sm text-muted">{panel.detail}</p>
      {panel.observedAt && (
        <p className="mt-auto pt-2 text-xs text-muted">Reading from {formatTime(panel.observedAt)}</p>
      )}
      </div>
    </article>
  );
}

// Open-Meteo gives local times like "2026-10-02T14:00" (or a plain date).
function formatTime(iso: string): string {
  const [date, time] = iso.split("T");
  return time ? `${time} on ${date}` : date;
}
