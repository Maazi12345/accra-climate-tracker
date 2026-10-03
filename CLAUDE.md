@AGENTS.md

# Accra climate tracker

A one-city site that shows what the heat, the air and the rain are doing in Accra, Ghana right now, and matches verified local climate actions to those conditions.

Built by Maazi for Terra Studio, Build 2. Reference repo (for patterns only, never copied wholesale): https://github.com/Terra-do/terra-studio-template-build-2

## Stack
- Next.js (App Router) with TypeScript. Tailwind v4 via `@tailwindcss/postcss`. No UI library, no database.
- npm is the package manager.
- Hosted on Vercel later. Every push to `main` will redeploy.
- Live feeds are fetched on the server and cached with `next: { revalidate }`. Nothing is fetched from the browser.

## The seven steps
1. Set up: empty Next.js project, this file, a starter page.
2. Live readings: the city (name, location, timezone), three live feeds, and three panels: heat, air, rain and flood.
3. Research the actions (outside Claude Code): the learner brings back `verified.json` and `flagged.json`. Don't research actions yourself. If needed, use a placeholder file with two or three clearly fake actions in the same format.
4. Show the actions: put the files in `data/`, check every entry against the format, show "What to do today" (matched actions first) and all actions with category filters and search.
5. How it's checked: a second page with pass/flag counts, the three checks, live data sources, and flagged entries with reasons.
6. Make it yours: colours, type, layout. Keep the level colours clearly different.
7. Ship it: run the build check, create a GitHub repo, push, deploy on Vercel.

## Rules
- The default feeds need no keys. If a feed needs one, it lives in `.env.local` (git-ignored) and in Vercel's environment variables. Never in code, never in `NEXT_PUBLIC_*`.
- Feeds are server-side only. A feed that fails must degrade to an "unavailable" panel, never crash the page.
- Don't add a public AI/chat feature. This site has no runtime AI on purpose.
- Style with Tailwind classes only. Colour tokens are in `app/globals.css`; add new ones there rather than hardcoding hex values.
- Keep the data schema from the reference repo (`lib/types.ts`). If a feature needs a new field, say so and stop.
- Run `npm run build` before pushing. Vercel runs the same build.

## Learning mode
The learner is new to this. Use plain words, and explain any technical term the first time you use it.
- Before each step, say in two or three lines what you're about to do and why, then wait for the learner to say go.
- After each step, name the files you created or changed, and ask one short question that checks they understood the step. Don't quiz more than once per step.
- If the learner asks you to just do it, do it, and still name what changed.
- Use the reference repo for the data schema, the feed pattern and the rules. Don't clone it or copy files wholesale; write the learner's code fresh and let their design differ.
- Use npm. Tell the learner the command to start the dev server and let them run it in their own terminal.

## Local
`npm install`, then `npm run dev` and open http://localhost:3000. Needs Node.js 20.9 or newer.
