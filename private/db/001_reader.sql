BEGIN;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid='public.ticketsale'::regclass AND relrowsecurity) OR NOT EXISTS (SELECT 1 FROM pg_class WHERE oid='public.ticketbuy'::regclass AND relrowsecurity) THEN RAISE EXCEPTION 'Required RLS is not enabled'; END IF;
END $$;
-- PREPARED ONLY. Apply once after secure credential delivery is available.
-- Deliberately NOLOGIN: a password and LOGIN are configured separately, not in migrations.
CREATE ROLE slc_dashboard_reader NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS CONNECTION LIMIT 5;
GRANT CONNECT ON DATABASE postgres TO slc_dashboard_reader;
GRANT USAGE ON SCHEMA public TO slc_dashboard_reader;
GRANT SELECT (ticket,date_out_date,prod_code,prod_name,net_wght,price_net,type_cach,status,status_cancel,source_deleted,synced_at) ON public.ticketsale TO slc_dashboard_reader;
GRANT SELECT (ticket,date_in_date,prod_code,net_wght,statkeep,source_deleted,synced_at) ON public.ticketbuy TO slc_dashboard_reader;
CREATE POLICY slc_dashboard_sales_read ON public.ticketsale FOR SELECT TO slc_dashboard_reader USING (status='O' AND status_cancel IS NULL AND source_deleted IS NOT TRUE);
CREATE POLICY slc_dashboard_intake_read ON public.ticketbuy FOR SELECT TO slc_dashboard_reader USING (prod_code='09' AND source_deleted IS NOT TRUE);
ALTER ROLE slc_dashboard_reader SET default_transaction_read_only = on;
ALTER ROLE slc_dashboard_reader SET statement_timeout = '15s';
ALTER ROLE slc_dashboard_reader SET idle_in_transaction_session_timeout = '15s';
ALTER ROLE slc_dashboard_reader SET search_path = pg_catalog,public;

COMMIT;
