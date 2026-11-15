# SLC sales dashboard

Sales-first Thai dashboard for โรงโม่หินศิลาชัยเจริญ, with a smaller stone-intake section. No haulage view. Responsive static HTML/CSS/JavaScript with the supplied company logo.

**All figures are illustrative. This repository has no Supabase connection, real sales/customer data, authentication, API keys or secrets.** The public demo can be viewed without login. That does not authorize public exposure of future real data.

## Run and check

Use Node.js 22 or newer. The browser app has no third-party runtime dependencies; Wrangler is pinned as a development dependency for deployment.

```sh
npm ci
npm run check
npm run build
npm run dev
```

Open http://localhost:3000. `npm run build` creates `dist/`; it is generated and not committed.

## Deploy using Cloudflare Workers Builds (Wrangler)

The repository supports the Cloudflare setup screen with a **Deploy command** field. That is Workers Builds, not the original Pages Git build screen. It serves the same static dashboard through Workers Static Assets; no custom server script or database is required.

| Setting | Value |
| --- | --- |
| Repository | `todsira/slc-sales-dashboard` |
| Production branch | `master` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | Repository root (blank) |
| Node version | `22` |
| Worker name | `slc-sales-dashboard` |

`wrangler.jsonc` declares `dist` as the static asset directory. The Cloudflare Worker project name must match this name. Workers Builds supplies its deployment authorization; do not commit Cloudflare tokens or Supabase secrets. No database variables are needed for this demo.

For local authenticated deployment, `npm run deploy` builds and runs Wrangler. To validate configuration **without uploading or deploying**, run `npm run deploy:check`. Local deployment requires your own authorized Cloudflare login; never put tokens in this repository.

## Alternative: Cloudflare Pages

If deliberately using the **Pages** Git integration instead, use framework **None**, branch **master**, build command **npm run build**, and build output **dist**. Pages automatically uploads its output and has no separate `wrangler deploy` command. Do not mix the two setup screens. This does not use `cloudflared` Tunnel.

Repository changes alone do not verify deployment success. A pre-existing connected Git build may deploy the updated commit automatically; check its build result and served site before claiming completion.

Official references:
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/workers/static-assets/get-started/
- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/

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
