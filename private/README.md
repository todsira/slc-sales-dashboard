# Private real-data reconstruction — NOT DEPLOYMENT READY

This is newly reconstructed source, not the lost earlier scaffold. Public demo and its default build remain unchanged. **Do not deploy/enable until all gates below pass.** No database keys, customer records, or actual figures are included.

## Current validation limits
After explicit owner approval, jose 6.1.3 was installed from official npm and the private dependency lockfile generated. Twenty-six native tests pass, including valid/expired/tampered owner JWTs, wrong audience/email/type/origin, disabled API and anonymous asset rejection. Wrangler dry-run bundling passes. Real Access-policy, live runtime, data reconciliation and browser QA remain unverified. Never reuse prior lost-scaffold test claims.

## Architecture
Separate Worker, all routes designed to be protected by Cloudflare Access RS256 signature/issuer/audience, exact owner email, expiry and application token type. All responses no-store. Static assets run through Worker first. No CORS or public data API. API returns aggregated data only, no customer/vehicle/ticket rows. Credentials remain server-side; no client environment injection. Public demo must remain a separate deployment.

## Configuration (requires concrete approval)
1. Create isolated hostname and owner-only Access application covering ALL paths. No bypass/service-token policies. Disable workers.dev and previews, verify no alternate route.
2. Server variables: APP_ORIGIN (exact HTTPS origin), ACCESS_TEAM_DOMAIN (team.cloudflareaccess.com), ACCESS_AUD, OWNER_EMAIL. No defaults.
3. Provision the dedicated column-limited PostgreSQL reader described in db/001_reader.sql and CREDENTIAL_PROPOSAL.md. Store its connection credential only in Cloudflare Hyperdrive, disable query caching, and add the verified configuration ID as HYPERDRIVE binding. No broad service-role key or client credential. The migration is prepared, not applied; it creates NOLOGIN until secure credential provisioning is ready.
4. Keep REAL_DATA_ENABLED=false until unauthorized requests, owner login, wrong audience/email, expired JWT, source errors, transaction and reconciliation tests pass. Source is read-only.
5. Approved deployment uses `cd private`, install pinned dependencies/lockfile, `npx wrangler deploy --dry-run`, then separate deployment authorization. No live deploy performed.

## Data definitions and limits
Sales: ticketsale completed status O, status_cancel null, not source-deleted, Bangkok weigh-out date, price_net before VAT, net_wght kg / 1000. Intake: ticketbuy prod_code 09 by date_in_date, not source-deleted; direct crushing and stockpiling external, stock-to-crusher internal (including legacy spelling), unknown separate. Cash/credit are sales classification, not collections/debt. No stock balance inference. A maximum of 100,000 rows per table; overflow and query errors fail closed. Production reads use one read-only repeatable-read transaction via pg 8.16.3 and Hyperdrive; last row sync timestamp does not establish complete synchronization. Reconcile live aggregates before release.

The previous REST adapter is retained only for regression tests; the HTTP handler imports the Hyperdrive adapter and cannot fall back to a broad REST credential. Real deployment and live reconciliation remain pending.
