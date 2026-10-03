import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { getCity, getFlaggedActions, getVerifiedActions, latestCheckDate } from "@/lib/data";

export const metadata: Metadata = {
  title: "How it's checked · Accra climate tracker",
};

const CHECKS = [
  {
    name: "Schema check",
    plain: "Is the entry complete?",
    text: "Every action has a title, summary, steps, the weather it applies to, and at least one source link. The site also re-checks this every time it's built, and refuses to publish a broken entry.",
  },
  {
    name: "Spot check",
    plain: "Does the source say what we say?",
    text: "Someone opened each source page and confirmed the programme exists and the details, like phone numbers and steps, match what the page says today.",
  },
  {
    name: "Freshness check",
    plain: "Is it still running?",
    text: "We looked for signs a programme has ended: closed pages, past deadlines, or only old sources. An ended programme is the most common problem, and the one that hurts people most.",
  },
];

const FEEDS = [
  {
    panel: "Heat",
    source: "Open-Meteo forecast API",
    url: "https://open-meteo.com/en/docs",
    what: "Current temperature, feels-like temperature and today's feels-like peak.",
    refresh: "About every hour",
  },
  {
    panel: "Air",
    source: "Open-Meteo air quality API",
    url: "https://open-meteo.com/en/docs/air-quality-api",
    what: "US Air Quality Index and fine particles (PM2.5), from a global model.",
    refresh: "About every hour",
  },
  {
    panel: "Rain and flood",
    source: "Open-Meteo forecast and flood APIs",
    url: "https://open-meteo.com/en/docs/flood-api",
    what: "Today's forecast rain, and river flow compared with normal for the date (GloFAS model).",
    refresh: "Rain hourly, river every 6 hours",
  },
];

export default function HowItsChecked() {
  const city = getCity();
  const verified = getVerifiedActions();
  const flagged = getFlaggedActions();
  const checked = latestCheckDate([...verified, ...flagged]);

  return (
    <>
      <SiteHeader city={city} current="checks" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20">
        <section className="pt-12 pb-8">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">How it&apos;s checked</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted">
            The actions on this site were researched with AI help and then checked before they went live. Here&apos;s how,
            and what didn&apos;t make it.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3" aria-label="Summary">
          <Stat value={verified.length} label="actions passed all three checks" />
          <Stat value={flagged.length} label="entries flagged and left out" />
          <Stat value={checked ?? "–"} label="date last checked" />
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight">The three checks</h2>
          <ol className="mt-5 grid gap-4 md:grid-cols-3">
            {CHECKS.map((c, i) => (
              <li key={c.name} className="rounded-2xl border border-line bg-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">Check {i + 1}</p>
                <h3 className="mt-1 text-lg font-semibold">{c.name}</h3>
                <p className="mt-1 text-sm font-medium">{c.plain}</p>
                <p className="mt-2 text-sm text-muted">{c.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight">Where the live data comes from</h2>
          <p className="mt-1 text-sm text-muted">
            All free and public, with no sign-up. If a feed doesn&apos;t answer, its panel says &quot;Unavailable&quot; instead of
            guessing.
          </p>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-card">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="p-4 font-semibold">Panel</th>
                  <th className="p-4 font-semibold">Source</th>
                  <th className="p-4 font-semibold">What it gives</th>
                  <th className="p-4 font-semibold">Refreshed</th>
                </tr>
              </thead>
              <tbody>
                {FEEDS.map((f) => (
                  <tr key={f.panel} className="border-b border-line last:border-0 align-top">
                    <td className="p-4 font-medium">{f.panel}</td>
                    <td className="p-4">
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">
                        {f.source}
                      </a>
                    </td>
                    <td className="p-4 text-muted">{f.what}</td>
                    <td className="p-4 text-muted">{f.refresh}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold tracking-tight">Flagged entries</h2>
          <p className="mt-1 text-sm text-muted">
            These failed a check, so they are <strong>not advice</strong>. They&apos;re listed so you can see what was left
            out and why.
          </p>
          <ul className="mt-5 grid gap-4 md:grid-cols-2">
            {flagged.map((a) => (
              <li key={a.id} className="rounded-2xl border border-dashed border-line bg-card p-5">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-foreground/5 px-2.5 py-0.5 font-semibold">{a.category}</span>
                  <span className="rounded-full border border-level-high/40 bg-level-high/10 px-2.5 py-0.5 font-semibold text-level-high">
                    Flagged
                  </span>
                </div>
                <h3 className="mt-3 font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm">
                  <span className="font-medium">Why: </span>
                  <span className="text-muted">{a.verification.flag_reason}</span>
                </p>
                <div className="mt-3 flex flex-col gap-1 text-xs">
                  {a.sources.map((s) => (
                    <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">
                      {s.title}
                    </a>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <p className="text-4xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}
