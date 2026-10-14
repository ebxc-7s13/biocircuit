-- Management API adapter: all catalog gates in one bounded result set.
-- Read-only metadata only; no user records, keys or connection strings.
begin read only;
select jsonb_build_object(
 'application_tables', (select jsonb_build_object('actual',count(*),'rls_enabled',count(*) filter(where c.relrowsecurity),'missing_rls',coalesce(jsonb_agg(c.relname)filter(where not c.relrowsecurity),'[]'))from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'and c.relkind='r'),
 'client_write_grants', (select coalesce(jsonb_agg(jsonb_build_object('table',c.relname,'role',r.role_name)),'[]')from pg_class c join pg_namespace n on n.oid=c.relnamespace cross join(values('anon'),('authenticated'))r(role_name)where n.nspname='public'and c.relkind='r'and(has_table_privilege(r.role_name,c.oid,'INSERT')or has_table_privilege(r.role_name,c.oid,'UPDATE')or has_table_privilege(r.role_name,c.oid,'DELETE')or has_table_privilege(r.role_name,c.oid,'TRUNCATE')or has_table_privilege(r.role_name,c.oid,'TRIGGER')or has_table_privilege(r.role_name,c.oid,'REFERENCES'))),
 'definer_search_paths', (select coalesce(jsonb_agg(n.nspname||'.'||p.proname),'[]')from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('public','private')and p.prosecdef and not coalesce(p.proconfig @> array['search_path=""'],false)),
 'private_buckets', (select coalesce(jsonb_agg(jsonb_build_object('id',id,'public',public,'file_size_limit',file_size_limit,'allowed_mime_types',allowed_mime_types)order by id),'[]')from storage.buckets where id in('academic-evidence','project-files','avatars')),
 'storage_policies', (select coalesce(jsonb_agg(jsonb_build_object('policyname',policyname,'cmd',cmd,'roles',roles)),'[]')from pg_policies where schemaname='storage'and tablename='objects'),
 'auth_triggers', (select coalesce(jsonb_agg(jsonb_build_object('name',tgname,'enabled',tgenabled)),'[]')from pg_trigger where tgrelid='auth.users'::regclass and tgname in('auth_create_profile','auth_sync_phone')),
 'privileged_rpcs', jsonb_build_object('anon_member_mutation',has_function_privilege('anon','public.community_action(text,jsonb,uuid)','EXECUTE'),'client_cleanup',has_function_privilege('authenticated','public.storage_cleanup_batch()','EXECUTE'),'client_retention',has_function_privilege('authenticated','public.prune_retained_data()','EXECUTE'),'anon_academic_read',has_table_privilege('anon','public.membership_applications','SELECT')),
 'expected_snapshot',to_regprocedure('public.public_snapshot(text)')is not null,
 'public_indexes',(select count(*)from pg_indexes where schemaname='public')
)as catalog;
rollback;
