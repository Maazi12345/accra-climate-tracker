import Link from "next/link";
import { ConditionPanel } from "@/components/ConditionPanel";
import { ActionCard } from "@/components/ActionCard";
import { ActionBrowser } from "@/components/ActionBrowser";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { getCity, getFlaggedActions, getVerifiedActions, latestCheckDate } from "@/lib/data";
import { fetchAir, fetchFlood, fetchWeather } from "@/lib/feeds";
import { activeConditions, airPanel, heatPanel, pickToday, rainPanel, TODAY_LIMIT } from "@/lib/conditions";

// Rebuild the page at most once an hour so the readings stay fresh.
export const revalidate = 3600;

export default async function Home() {
  const city = getCity();
  const actions = getVerifiedActions();
  const flagged = getFlaggedActions();

  // Ask all three feeds at the same time, then turn the numbers into panels.
  const [weather, air, flood] = await Promise.all([fetchWeather(city), fetchAir(city), fetchFlood(city)]);
  const panels = [heatPanel(weather), airPanel(air), rainPanel(weather, flood)];
  const active = activeConditions(panels);
  const today = pickToday(actions, panels);

  const dateLabel = new Date().toLocaleDateString("en-GB", {
    timeZone: city.timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const checked = latestCheckDate(actions);

  return (
    <>
      <SiteHeader city={city} current="home" />
      <section className="bg-forest text-forest-ink">
        <div className="mx-auto max-w-5xl px-4 pt-12 pb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">{dateLabel}</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight md:text-6xl">{city.name}, right now</h1>
          <p className="mt-3 max-w-2xl text-lg opacity-85">{city.tagline}</p>

          <div className="mt-8 grid gap-4 text-foreground md:grid-cols-3" aria-label="Live conditions">
            {panels.map((p) => (
              <ConditionPanel key={p.key} panel={p} />
            ))}
          </div>
          <p className="mt-4 text-xs opacity-75">Live data from Open-Meteo, refreshed about every hour.</p>
        </div>
      </section>
      <div className="kente-stripe" aria-hidden="true" />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20">

        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight">What to do today</h2>
          {today.length > 0 ? (
            <>
              <p className="mt-1 text-sm text-muted">
                {today.length === 1 ? "The action" : `The ${today.length} actions`} that fit{today.length === 1 ? "s" : ""} today&apos;s
                readings, most urgent first. We show up to {TODAY_LIMIT}.
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {today.map((t) => (
                  <ActionCard key={t.action.id} action={t.action} reasons={t.reasons} />
                ))}
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-2xl border border-line bg-card p-6">
              <p className="font-medium">Nothing unusual in {city.name} today.</p>
              <p className="mt-1 text-sm text-muted">
                None of today&apos;s readings call for a specific action.{" "}
                <a href="#actions" className="text-accent underline underline-offset-4">See all {actions.length} actions</a> for
                things that help any day.
              </p>
            </div>
          )}
        </section>

        <section id="actions" className="mt-16 scroll-mt-8">
          <h2 className="text-2xl font-bold tracking-tight">All actions</h2>
          <p className="mt-1 mb-5 text-sm text-muted">
            Every checked action for {city.name}: {actions.length} across {new Set(actions.map((a) => a.category)).size} categories.
            Actions that only matter in certain weather are faded when that weather isn&apos;t happening.
          </p>
          <ActionBrowser actions={actions} active={active} />
        </section>

        <section className="mt-16 rounded-2xl border border-line bg-card p-6">
          <h2 className="text-lg font-semibold">How this guide is checked</h2>
          <p className="mt-2 text-sm text-muted">
            Every action passed three checks before it went live
            {checked ? `, last on ${checked}` : ""}. {flagged.length} {flagged.length === 1 ? "entry" : "entries"} failed a check
            and {flagged.length === 1 ? "is" : "are"} listed with the reason, never as advice.
          </p>
          <Link href="/how-its-checked" className="mt-3 inline-block text-sm text-accent underline underline-offset-4">
            See the checks and the flagged entries
          </Link>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
