-- Defense in depth for private buckets. project-images stores only processor-encoded PNG,
-- and academic evidence ingestion is disabled, so neither bucket accepts documents even
-- through privileged writes. Existing objects are unaffected (both buckets were empty).
update storage.buckets set allowed_mime_types=array['image/png']where id='project-files';
update storage.buckets set allowed_mime_types=array['image/png','image/jpeg']where id='academic-evidence';
-- Schedule the existing service-only retention policy with the free Postgres scheduler.
-- Skipped where pg_cron is unavailable (local PGlite). Run history is bounded to 30 days.
do $$begin
if exists(select 1 from pg_available_extensions where name='pg_cron')then
create extension if not exists pg_cron with schema pg_catalog;
perform cron.schedule('biocircuit-retention','17 3 * * *',$job$select public.prune_retained_data();delete from cron.job_run_details where end_time<now()-interval '30 days'$job$);
end if;end$$;
