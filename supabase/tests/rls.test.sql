-- Native Supabase pgTAP gate; full cross-account fixture suite is scripts/test-db.mjs.
begin;
create extension if not exists pgtap with schema extensions;
select plan(5);
-- Keep all five assertions in one result set: Management API returns the last
-- nonempty result set rather than all separate SELECT results.
select ok(not exists(select 1 from pg_tables t join pg_class c on c.oid=('public.'||quote_ident(t.tablename))::regclass where t.schemaname='public'and not c.relrowsecurity),'every public application table has RLS') as assertion
union all select ok(not has_table_privilege('authenticated','public.roles','INSERT'),'clients cannot assign roles')
union all select ok(not has_table_privilege('authenticated','public.profiles','UPDATE'),'clients cannot assign academic flags')
union all select ok(not has_table_privilege('anon','public.membership_applications','SELECT'),'anonymous caller cannot read private academics')
union all
select ok(not has_function_privilege('anon','public.community_action(text,jsonb,uuid)','EXECUTE'),'anonymous caller cannot invoke member mutations');
select *from finish();
rollback;
