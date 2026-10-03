// The three live feeds, all from Open-Meteo (free, no sign-up, no key).
//
// These run on the server, never in the visitor's browser. Next.js keeps
// each answer for a while ("revalidate", in seconds) so we don't ask the
// feed again on every page view.
//
// Every function returns null if anything goes wrong. The page then shows
// "Unavailable" for that panel instead of crashing.

import type { City } from "./types";

const HOUR = 60 * 60;

export interface WeatherReading {
  temperature: number; // °C right now
  feelsLike: number; // °C right now, including humidity
  feelsLikeMaxToday: number; // today's hottest feels-like
  rainTodayMm: number; // forecast total for today
  rainChanceMax: number | null; // highest % chance of rain today
  time: string; // local time of the reading
}

export interface AirReading {
  usAqi: number; // US Air Quality Index
  pm25: number; // fine particles, µg/m³
  time: string;
}

export interface FloodReading {
  discharge: number; // river flow today, m³/s
  dischargeMean: number; // usual flow for this day of the year
  date: string; // YYYY-MM-DD
}

function place(city: City) {
  return `latitude=${city.latitude}&longitude=${city.longitude}`;
}

export async function fetchWeather(city: City): Promise<WeatherReading | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast?${place(city)}` +
    `&current=temperature_2m,apparent_temperature` +
    `&daily=apparent_temperature_max,precipitation_sum,precipitation_probability_max` +
    `&forecast_days=1&timezone=${encodeURIComponent(city.timezone)}`;
  try {
    const res = await fetch(url, { next: { revalidate: HOUR } });
    if (!res.ok) return null;
    const json = await res.json();
    return {
      temperature: json.current.temperature_2m,
      feelsLike: json.current.apparent_temperature,
      feelsLikeMaxToday: json.daily.apparent_temperature_max[0],
      rainTodayMm: json.daily.precipitation_sum?.[0] ?? 0,
      rainChanceMax: json.daily.precipitation_probability_max?.[0] ?? null,
      time: json.current.time,
    };
  } catch {
    return null;
  }
}

export async function fetchAir(city: City): Promise<AirReading | null> {
  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality?${place(city)}` +
    `&current=us_aqi,pm2_5&timezone=${encodeURIComponent(city.timezone)}`;
  try {
    const res = await fetch(url, { next: { revalidate: HOUR } });
    if (!res.ok) return null;
    const json = await res.json();
    if (typeof json.current?.us_aqi !== "number") return null;
    return {
      usAqi: Math.round(json.current.us_aqi),
      pm25: json.current.pm2_5,
      time: json.current.time,
    };
  } catch {
    return null;
  }
}

// River flood signal from the GloFAS global river model: today's flow at the
// nearest modelled river compared with the usual flow for this date.
export async function fetchFlood(city: City): Promise<FloodReading | null> {
  const url =
    `https://flood-api.open-meteo.com/v1/flood?${place(city)}` +
    `&daily=river_discharge,river_discharge_mean&forecast_days=1`;
  try {
    const res = await fetch(url, { next: { revalidate: 6 * HOUR } });
    if (!res.ok) return null;
    const json = await res.json();
    const flow = json.daily?.river_discharge?.[0];
    const usual = json.daily?.river_discharge_mean?.[0];
    if (typeof flow !== "number" || typeof usual !== "number") return null;
    return { discharge: flow, dischargeMean: usual, date: json.daily.time[0] };
  } catch {
    return null;
  }
}
