# Private real-data reconstruction — NOT DEPLOYMENT READY

This is newly reconstructed source, not the lost earlier scaffold. Public demo and its default build remain unchanged. **Do not deploy/enable until all gates below pass.** No database keys, customer records, or actual figures are included.

## Current validation limits
`jose` is pinned but NOT installed because the prior installation approval was rejected. No workaround was used. Native data tests and syntax can run; JWT integration, bundling, runtime and browser QA are unverified. A reproducible private dependency lockfile must be generated only after installation is permitted. Never reuse prior scaffold test claims.

## Architecture
Separate Worker, all routes designed to be protected by Cloudflare Access RS256 signature/issuer/audience, exact owner email, expiry and application token type. All responses no-store. Static assets run through Worker first. No CORS or public data API. API returns aggregated data only, no customer/vehicle/ticket rows. Credentials remain server-side; no client environment injection. Public demo must remain a separate deployment.

## Configuration (requires concrete approval)
1. Create isolated hostname and owner-only Access application covering ALL paths. No bypass/service-token policies. Disable workers.dev and previews, verify no alternate route.
2. Server variables: APP_ORIGIN (exact HTTPS origin), ACCESS_TEAM_DOMAIN (team.cloudflareaccess.com), ACCESS_AUD, OWNER_EMAIL, SUPABASE_URL. No defaults.
3. Provision a least-privilege read credential as encrypted SUPABASE_READ_KEY. Existing RLS tables do not expose reads to anonymous clients. Do not relax RLS or silently use an unrestricted service role; credential/grant design needs review. No secrets in GitHub, .env or frontend.
4. Keep REAL_DATA_ENABLED=false until unauthorized requests, owner login, wrong audience/email, expired JWT, source errors, pagination and reconciliation tests pass. Source is read-only.
5. Approved deployment uses `cd private`, install pinned dependencies/lockfile, `npx wrangler deploy --dry-run`, then separate deployment authorization. No live deploy performed.

## Data definitions and limits
Sales: ticketsale completed status O, status_cancel null, not source-deleted, Bangkok weigh-out date, price_net before VAT, net_wght kg / 1000. Intake: ticketbuy prod_code 09 by date_in_date, not source-deleted; direct crushing and stockpiling external, stock-to-crusher internal (including legacy spelling), unknown separate. Cash/credit are sales classification, not collections/debt. No stock balance inference. A maximum of 100,000 rows per table; errors and changing page counts fail closed. Reads are not a database snapshot; last row sync timestamp does not establish complete synchronization. Reconcile live aggregates before release.
