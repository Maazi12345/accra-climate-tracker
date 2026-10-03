// The shapes of our data. These match the Terra Studio reference so the
// action files from the research step (step 3) drop straight in.
// Don't change them without a good reason.

export type Condition =
  | "any"
  | "heat-high"
  | "heat-extreme"
  | "cold-extreme"
  | "air-moderate"
  | "air-high"
  | "rain-heavy"
  | "flood-risk";

export interface City {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  tagline: string;
}

export interface Source {
  title: string;
  url: string;
}

export interface Verification {
  status: "verified" | "flagged";
  lastChecked: string; // YYYY-MM-DD
  method: string;
  flag_reason?: string;
}

export interface Action {
  id: string;
  city: string;
  category: string;
  title: string;
  summary: string;
  details: string[];
  /** Which live conditions this action fits. "any" means always show it. */
  when: Condition[];
  sources: Source[];
  verification: Verification;
}
