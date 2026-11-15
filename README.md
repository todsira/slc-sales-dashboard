# SLC sales dashboard

Sales-first Thai dashboard for โรงโม่หินศิลาชัยเจริญ, with a smaller stone-intake section. No haulage view. Responsive static HTML/CSS/JavaScript with the supplied company logo.

**All figures are illustrative. This repository has no Supabase connection, real sales/customer data, authentication, API keys or secrets.** The public demo can be viewed without login. That does not authorize public exposure of future real data.

## Run and check

Use Node.js 22 or newer (no third-party dependencies).

```sh
npm ci
npm run check
npm run build
npm run dev
```

Open http://localhost:3000. `npm run build` creates `dist/`; it is generated and not committed.

## Deploy to Cloudflare Pages from GitHub

1. Cloudflare dashboard → Workers & Pages → Create application → Pages → Import an existing Git repository.
2. Select `todsira/slc-sales-dashboard`.
3. Framework preset: **None**.
4. Production branch: **master** (or the branch you explicitly choose).
5. Build command: **npm run build**.
6. Build output directory: **dist**.
7. Root directory: leave blank. Set Node version **22** if needed.
8. Deploy. No environment variables, secrets, database bindings, Workers or Tunnel are needed for this demo.

This uses **Cloudflare Pages**, not `cloudflared` Tunnel. Git-connected Pages automatically builds updates to its selected production branch. Repository preparation does not itself configure or deploy a Cloudflare project.

Reference: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/

## Layout and behavior

- Revenue, sold tonnes, credit sales and external intake KPIs.
- Day / 7-day / month views with internally reconciled example totals.
- Sales versus external intake volumes (not a stock balance).
- Product breakdown, accessible detail dialog and cash/credit sales mix.
- Internal stock-to-crusher movement remains separate from incoming stone.
- Explicit disconnected/demo data freshness status.

## Files

- `public/index.html`: semantic Thai interface
- `public/styles.css`: responsive layout and supplied logo framing
- `public/app.js`: client interaction
- `public/demo-data.js`: illustrative fixtures only
- `public/_headers`: security headers; network connections blocked by CSP
- `scripts/`: dependency-free build/dev server
- `test/`: fixtures, disclosure, assets and credential regression checks

## Before connecting real Supabase data

Do not place database credentials in this public repository or browser code. Never expose service-role keys, connection strings or secrets using frontend environment prefixes. Store required secrets only in Cloudflare's encrypted server-side configuration, with a narrow read-only server endpoint and access control agreed with the owner. Do not paste keys in commits, PRs, logs or screenshots. `.env*`, `.dev.vars*` and local deployment state are ignored.

Decide explicitly which aggregated business data may be public before replacing the fixtures. Add authorization, input validation and caching server-side; preserve source dates, freshness indicators, sales exclusions and intake-operation distinctions. The current CSP deliberately blocks network access until that separately authorized integration is implemented.

## Validation scope

Automated tests check numerical consistency, local assets and absence of backend connections. JavaScript syntax and static build are checked. A real desktop/mobile browser visual pass should be performed on the deployed preview; no real financial report figures are represented here.
