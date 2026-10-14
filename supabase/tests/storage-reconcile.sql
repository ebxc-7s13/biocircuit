-- Read-only private media reconciliation: aggregate counts only, no paths or identities.
-- orphan_objects: stored bytes with no owning record and no queued deletion (e.g. failed
-- upload compensation). missing_objects: records whose object is absent. stale_queue:
-- queued deletions whose object is already gone (safe to acknowledge).
begin read only;
with obj as (select bucket_id b,name path from storage.objects where bucket_id in('avatars','project-files','academic-evidence')),
rec as (select 'avatars'::text b,path from public.avatars union all select 'project-files',path from public.project_images),
q as (select bucket b,path from private.storage_gc)
select jsonb_build_object(
 'objects',(select count(*)from obj),
 'records',(select count(*)from rec),
 'queued',(select count(*)from q),
 'orphan_objects',(select count(*)from obj o where o.b<>'academic-evidence'and not exists(select 1 from rec r where r.b=o.b and r.path=o.path)and not exists(select 1 from q where q.b=o.b and q.path=o.path)),
 'missing_objects',(select count(*)from rec r where not exists(select 1 from obj o where o.b=r.b and o.path=r.path)),
 'stale_queue',(select count(*)from q where not exists(select 1 from obj o where o.b=q.b and o.path=q.path)),
 'evidence_objects',(select count(*)from obj where b='academic-evidence')
)as reconciliation;
rollback;
