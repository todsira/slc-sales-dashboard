-- Read-only post-provisioning checks. Do not interpret a false result as success.
SELECT rolname,rolcanlogin,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolreplication,rolbypassrls,rolconnlimit FROM pg_roles WHERE rolname='slc_dashboard_reader';
SELECT parent.rolname AS inherited_role FROM pg_auth_members m JOIN pg_roles member ON m.member=member.oid JOIN pg_roles parent ON m.roleid=parent.oid WHERE member.rolname='slc_dashboard_reader';
SELECT table_name,column_name FROM information_schema.column_privileges WHERE grantee='slc_dashboard_reader' ORDER BY table_name,column_name;
SELECT c.relname,has_table_privilege('slc_dashboard_reader',c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS forbidden_write FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid WHERE n.nspname='public' AND c.relkind IN ('r','p');
SELECT schemaname,tablename,policyname,roles,cmd,qual FROM pg_policies WHERE 'slc_dashboard_reader'=ANY(roles);
-- With a trusted administrative session, perform SELECT-only role test separately:
-- BEGIN READ ONLY; SET LOCAL ROLE slc_dashboard_reader;
-- SELECT count(ticket) FROM public.ticketsale;
-- SELECT count(ticket) FROM public.ticketbuy;
-- ROLLBACK;
-- Check prohibited column access in a separate read-only transaction, expecting denial.
-- No test INSERT/UPDATE/DELETE is needed or permitted.
