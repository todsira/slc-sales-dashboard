# Proposed least-privilege source connection — NOT APPLIED

The existing REST scaffold must not be enabled with a broad service-role/secret API key merely to satisfy RLS. Proposed direct Postgres connection uses Cloudflare Hyperdrive with a new dedicated login `slc_dashboard_reader`.

Approval scope:
- Create role with LOGIN, NOINHERIT, NOSUPERUSER, NOCREATEDB, NOCREATEROLE, NOREPLICATION, NOBYPASSRLS; no membership in existing privileged roles.
- Permit CONNECT to this database and USAGE on public schema only.
- Column-level SELECT on ticketsale: ticket, date_out_date, prod_code, prod_name, net_wght, price_net, type_cach, status, status_cancel, source_deleted, synced_at.
- Column-level SELECT on ticketbuy: ticket, date_in_date, prod_code, net_wght, statkeep, source_deleted, synced_at.
- Role-specific SELECT RLS policies: sales status='O', status_cancel IS NULL, source_deleted IS NOT TRUE; intake prod_code='09', source_deleted IS NOT TRUE. Existing policies/grants remain unchanged.
- No customer/contact/vehicle columns; no INSERT, UPDATE, DELETE, TRUNCATE, DDL or BYPASSRLS.
- Password generated securely, never in source/chat; store only in Cloudflare Hyperdrive connection configuration. Review existing PUBLIC routine/schema grants for indirect privilege paths before enabling role.
- Connection limit, statement timeout, read-only transaction default; Worker performs a read-only repeatable-read transaction with parameterized bounded date range. Disable Hyperdrive query caching to avoid misleading freshness.
- Add pinned PostgreSQL driver and switch private backend to aggregate queries; preserve owner Access and no-store responses.

Validation before activation:
1. Privilege checks establish expected allowed columns and denied writes/PII; test as this role, without performing actual destructive operations.
2. Owner-only Access policy denies anonymous, wrong identity, missing/wrong audience, expired tokens and alternate deployment hostname.
3. Compare protected API totals to independent read-only SQL for one completed day, 7-day and current-month range; include cash/credit/unknown, product sums, intake direct/stock/internal/unknown, dates and synchronization evidence.
4. No records yields explicit zero plus no-record status; an upstream failure never becomes zero/demo data.
5. Verify actual private frontend and responsive rendering, no client/server logs expose credentials or raw rows.
6. Only after tests pass set REAL_DATA_ENABLED true. Public demo remains separate.
