-- Read-only catalog inventory before any staging schema mutation.
-- Managed Auth/Storage tables are expected; inspect only application object counts.
-- No user records, bucket names, credentials or connection strings are returned.
begin read only;
select 'pre_migration_inventory' as gate,
  (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r') as public_tables,
  (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('v','m')) as public_views,
  exists(select 1 from pg_namespace where nspname='private') as private_schema_exists,
  exists(select 1 from pg_namespace where nspname='supabase_migrations') as migration_schema_exists,
  (select count(*) from storage.buckets) as bucket_count,
  (select count(*) from pg_trigger t join pg_proc p on p.oid=t.tgfoid join pg_namespace n on n.oid=p.pronamespace where t.tgrelid='auth.users'::regclass and not t.tgisinternal and n.nspname in ('public','private')) as app_auth_triggers;
rollback;
