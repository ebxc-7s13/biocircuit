-- Read-only hosted catalog gate. No user records, keys or private content are returned.
-- This is catalog/privilege verification, NOT two-authenticated-user HTTP/RLS acceptance.
begin read only;
select 'application_tables' as gate,
  count(*) as actual,
  count(*) filter (where c.relrowsecurity) as rls_enabled,
  coalesce(jsonb_agg(c.relname) filter (where not c.relrowsecurity), '[]') as missing_rls
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r';
select 'client_write_grants' as gate, coalesce(jsonb_agg(jsonb_build_object('table', c.relname, 'role', r.role_name)), '[]') as violations
from pg_class c join pg_namespace n on n.oid=c.relnamespace
cross join (values ('anon'), ('authenticated')) r(role_name)
where n.nspname='public' and c.relkind='r'
and (has_table_privilege(r.role_name,c.oid,'INSERT') or has_table_privilege(r.role_name,c.oid,'UPDATE') or has_table_privilege(r.role_name,c.oid,'DELETE') or has_table_privilege(r.role_name,c.oid,'TRUNCATE') or has_table_privilege(r.role_name,c.oid,'TRIGGER') or has_table_privilege(r.role_name,c.oid,'REFERENCES'));
select 'definer_search_paths' as gate, coalesce(jsonb_agg(n.nspname||'.'||p.proname), '[]') as violations
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname in ('public','private') and p.prosecdef
and not coalesce(p.proconfig @> array['search_path=""'],false);
select 'private_buckets' as gate, id, public, file_size_limit, allowed_mime_types
from storage.buckets where id in ('academic-evidence','project-files','avatars') order by id;
select 'storage_policies_review' as gate, policyname, cmd, roles
from pg_policies where schemaname='storage' and tablename='objects';
select 'auth_triggers' as gate, tgname, tgenabled
from pg_trigger where tgrelid='auth.users'::regclass and tgname in ('auth_create_profile','auth_sync_phone');
select 'privileged_rpcs' as gate,
  has_function_privilege('anon','public.community_action(text,jsonb,uuid)','EXECUTE') as anon_member_mutation,
  has_function_privilege('authenticated','public.storage_cleanup_batch()','EXECUTE') as client_cleanup,
  has_function_privilege('authenticated','public.prune_retained_data()','EXECUTE') as client_retention,
  has_table_privilege('anon','public.membership_applications','SELECT') as anon_academic_read;
rollback;
