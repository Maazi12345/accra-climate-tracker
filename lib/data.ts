// Reads our data files and checks every action against the format.
// If an entry is broken, the build stops with a clear message instead of
// showing a half-broken page.

import cityJson from "@/data/city.json";
import verifiedJson from "@/data/verified.json";
import flaggedJson from "@/data/flagged.json";
import type { Action, City, Condition } from "./types";

const ALLOWED_WHEN: Condition[] = [
  "any", "heat-high", "heat-extreme", "cold-extreme", "air-moderate", "air-high", "rain-heavy", "flood-risk",
];

export function getCity(): City {
  return cityJson as City;
}

export function getVerifiedActions(): Action[] {
  return checkAll(verifiedJson, "verified");
}

export function getFlaggedActions(): Action[] {
  return checkAll(flaggedJson, "flagged");
}

/** The most recent "lastChecked" date across a list of actions. */
export function latestCheckDate(actions: Action[]): string | null {
  const dates = actions.map((a) => a.verification.lastChecked).sort();
  return dates.length ? dates[dates.length - 1] : null;
}

// ---- The format check -------------------------------------------------

function checkAll(raw: unknown, status: "verified" | "flagged"): Action[] {
  const file = `data/${status}.json`;
  if (!Array.isArray(raw)) throw new Error(`${file} should be a list of actions.`);
  const problems: string[] = [];
  const ids = new Set<string>();
  raw.forEach((entry, i) => {
    const e = entry as Record<string, unknown>;
    const name = typeof e.id === "string" ? e.id : `entry ${i + 1}`;
    const bad = (msg: string) => problems.push(`${name}: ${msg}`);

    for (const key of ["id", "city", "category", "title", "summary"]) {
      if (typeof e[key] !== "string" || !(e[key] as string).trim()) bad(`"${key}" is missing or empty`);
    }
    if (typeof e.id === "string") {
      if (ids.has(e.id)) bad("duplicate id");
      ids.add(e.id);
    }
    if (!Array.isArray(e.details) || e.details.length === 0) bad(`"details" needs at least one line`);
    if (!Array.isArray(e.when) || e.when.length === 0) bad(`"when" needs at least one value`);
    else e.when.forEach((w) => { if (!ALLOWED_WHEN.includes(w as Condition)) bad(`"when" has an unknown value "${w}"`); });
    if (!Array.isArray(e.sources) || e.sources.length === 0) bad("needs at least one source");
    else e.sources.forEach((s) => {
      const src = s as Record<string, unknown>;
      if (typeof src.title !== "string" || typeof src.url !== "string" || !src.url.startsWith("https://")) bad("a source needs a title and an https:// link");
    });
    const v = e.verification as Record<string, unknown> | undefined;
    if (!v) bad(`"verification" is missing`);
    else {
      if (v.status !== status) bad(`status should be "${status}" in ${file}`);
      if (typeof v.lastChecked !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v.lastChecked)) bad(`"lastChecked" should look like 2026-10-02`);
      if (status === "flagged" && !v.flag_reason) bad(`flagged entries need a "flag_reason"`);
    }
  });
  if (problems.length) throw new Error(`Problems in ${file}:\n- ${problems.join("\n- ")}`);
  return raw as Action[];
}
