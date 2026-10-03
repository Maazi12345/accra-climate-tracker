// Turns raw numbers into plain-language panels and "conditions"
// (like "heat-high") that step 4 will use to pick today's actions.
//
// The thresholds are simple on purpose and all live here, so you can tune
// them for Accra later.

import type { AirReading, FloodReading, WeatherReading } from "./feeds";
import type { Action, Condition } from "./types";

export type Level = "good" | "moderate" | "high" | "extreme" | "unknown";

export interface Panel {
  key: "heat" | "air" | "rain";
  label: string;
  value: string; // the big number
  unit: string;
  level: Level;
  headline: string; // short plain-language read
  detail: string; // one line of context
  conditions: Condition[]; // conditions this reading switches on
  observedAt: string | null;
}

// HEAT uses the "feels like" temperature in °C, which includes humidity.
// Health services usually advise caution from about 30 and warn from 35.
// Accra often feels 30+ in the afternoon, so "Hot" will be common.
export function heatPanel(w: WeatherReading | null): Panel {
  if (!w) return unavailable("heat", "Heat", "Temperature data is unavailable right now.");
  const worst = Math.max(w.feelsLike, w.feelsLikeMaxToday);
  let level: Level = "good";
  let headline = "Comfortable";
  let conditions: Condition[] = [];
  if (worst >= 40) {
    level = "extreme"; headline = "Extreme heat"; conditions = ["heat-extreme", "heat-high"];
  } else if (worst >= 35) {
    level = "high"; headline = "Dangerous heat"; conditions = ["heat-high"];
  } else if (worst >= 30) {
    level = "moderate"; headline = "Hot"; conditions = ["heat-high"];
  }
  // If it's the afternoon peak (not right now) that triggers the warning,
  // say so, so a cool night reading doesn't sit next to "Dangerous heat".
  const threshold: Record<Level, number> = { extreme: 40, high: 35, moderate: 30, good: -Infinity, unknown: -Infinity };
  if (w.feelsLike < threshold[level]) {
    headline = `${headline} later today (peak ${num(w.feelsLikeMaxToday)}°C)`;
  }
  return {
    key: "heat", label: "Heat", value: num(w.feelsLike), unit: "°C feels like", level, headline,
    detail: `Actual ${num(w.temperature)}°C. Today's peak will feel like ${num(w.feelsLikeMaxToday)}°C.`,
    conditions, observedAt: w.time,
  };
}

// AIR uses the US Air Quality Index (AQI): 0–50 good, 51–100 moderate,
// 101–150 unhealthy for sensitive groups, above 150 unhealthy for everyone.
export function airPanel(a: AirReading | null): Panel {
  if (!a) return unavailable("air", "Air", "Air quality data is unavailable right now.");
  let level: Level = "good";
  let headline = "Good";
  let conditions: Condition[] = [];
  if (a.usAqi > 150) {
    level = "extreme"; headline = "Unhealthy for everyone"; conditions = ["air-high", "air-moderate"];
  } else if (a.usAqi > 100) {
    level = "high"; headline = "Unhealthy for sensitive groups"; conditions = ["air-high", "air-moderate"];
  } else if (a.usAqi > 50) {
    level = "moderate"; headline = "Moderate"; conditions = ["air-moderate"];
  }
  return {
    key: "air", label: "Air", value: String(a.usAqi), unit: "US AQI", level, headline,
    detail: `Fine particles (PM2.5) at ${num(a.pm25)} µg/m³.`,
    conditions, observedAt: a.time,
  };
}

// RAIN AND FLOOD. Rain is today's forecast total in mm: 25+ is a heavy day,
// 50+ is the kind that floods low-lying streets. Flood risk compares river
// flow with the usual for today: 2× is well above normal, 5× is flood level.
export function rainPanel(w: WeatherReading | null, f: FloodReading | null): Panel {
  if (!w && !f) return unavailable("rain", "Rain and flood", "Rain and river data are unavailable right now.");
  const mm = w?.rainTodayMm ?? 0;
  const ratio = f && f.dischargeMean > 0 ? f.discharge / f.dischargeMean : null;
  let level: Level = "good";
  let headline = "Dry";
  const conditions: Condition[] = [];
  if (mm >= 50 || (ratio !== null && ratio >= 5)) {
    level = "extreme"; headline = ratio !== null && ratio >= 5 ? "River far above normal" : "Very heavy rain";
    conditions.push("rain-heavy", "flood-risk");
  } else if (mm >= 25 || (ratio !== null && ratio >= 2)) {
    level = "high"; headline = ratio !== null && ratio >= 2 ? "River above normal" : "Heavy rain";
    conditions.push("rain-heavy", "flood-risk");
  } else if (mm >= 5) {
    level = "moderate"; headline = "Rain today"; conditions.push("rain-heavy");
  } else if (mm > 0) {
    headline = "Light rain";
  }
  const chance = w?.rainChanceMax != null ? ` ${w.rainChanceMax}% chance of rain.` : "";
  const river = ratio !== null ? ` River flow is ${ratio.toFixed(1)}× normal for today.` : " River data unavailable.";
  return {
    key: "rain", label: "Rain and flood", value: num(mm), unit: "mm today", level, headline,
    detail: `Forecast for today.${chance}${river}`,
    conditions, observedAt: w?.time ?? f?.date ?? null,
  };
}

/** Every condition switched on right now. "any" is always on. */
export function activeConditions(panels: Panel[]): Condition[] {
  const set = new Set<Condition>(["any"]);
  panels.forEach((p) => p.conditions.forEach((c) => set.add(c)));
  return [...set];
}

function unavailable(key: Panel["key"], label: string, detail: string): Panel {
  return { key, label, value: "–", unit: "", level: "unknown", headline: "Unavailable", detail, conditions: [], observedAt: null };
}

function num(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// ---- Picking "What to do today" ---------------------------------------
//
// 1. Only actions whose own "when" tags match a condition happening now.
//    Being tagged "any" alone isn't enough to appear here.
// 2. Score each match by how serious the reading behind it is:
//    extreme = 3, high = 2, moderate = 1.
// 3. Ties: the action tied to the more serious condition first (e.g. "extreme
//    heat" before "hot"), then actions written only for that condition (no
//    "any"), then actions matching more of today's conditions, then file order.
// 4. Show at most 5. Never pad with unrelated actions.


const LEVEL_SCORE: Record<Level, number> = { extreme: 3, high: 2, moderate: 1, good: 0, unknown: 0 };

export const TODAY_LIMIT = 5;

// How serious each condition is on its own, used to break ties.
const CONDITION_RANK: Record<Condition, number> = {
  any: 0, "heat-high": 1, "air-moderate": 1, "rain-heavy": 1,
  "air-high": 2, "flood-risk": 2, "heat-extreme": 3, "cold-extreme": 3,
};

export interface TodayPick {
  action: Action;
  score: number;
  reasons: string[]; // e.g. "Heat: Hot (32 °C feels like)"
}

export function pickToday(actions: Action[], panels: Panel[], limit = TODAY_LIMIT): TodayPick[] {
  // For each active condition, remember its score and a plain-language reason.
  const why = new Map<Condition, { score: number; reason: string }>();
  for (const p of panels) {
    const score = LEVEL_SCORE[p.level];
    for (const c of p.conditions) {
      const prev = why.get(c);
      if (!prev || score > prev.score) {
        why.set(c, { score, reason: p.headline.includes("(") ? `${p.label}: ${p.headline}` : `${p.label}: ${p.headline} (${p.value} ${p.unit})` });
      }
    }
  }

  const picks = actions
    .map((action, order) => {
      const hits = action.when.filter((w) => w !== "any" && why.has(w));
      return {
        action,
        order,
        score: Math.max(0, ...hits.map((h) => why.get(h)!.score)),
        rank: Math.max(0, ...hits.map((h) => CONDITION_RANK[h])),
        specific: !action.when.includes("any"),
        hits: hits.length,
        reasons: [...new Set(hits.map((h) => why.get(h)!.reason))],
      };
    })
    .filter((p) => p.hits > 0 && p.score > 0);

  picks.sort(
    (a, b) =>
      b.score - a.score ||
      b.rank - a.rank ||
      Number(b.specific) - Number(a.specific) ||
      b.hits - a.hits ||
      a.order - b.order,
  );

  return picks.slice(0, limit).map(({ action, score, reasons }) => ({ action, score, reasons }));
}

export const CONDITION_LABELS: Record<Condition, string> = {
  any: "Any day",
  "heat-high": "When it's hot",
  "heat-extreme": "Extreme heat",
  "cold-extreme": "Extreme cold",
  "air-moderate": "When air is moderate",
  "air-high": "When air is poor",
  "rain-heavy": "Rainy days",
  "flood-risk": "Flood risk",
};
