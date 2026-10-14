-- Preserve every policy predicate, role, command and grant. Only cache the
-- row-independent authenticated UID once per statement, per Supabase guidance.
-- No data writes, role assignments, new access paths or verification changes.
begin;
alter policy "blocks_read" on public."blocks" using ((user_id = (select auth.uid())));
alter policy "bookmarks_read" on public."bookmarks" using (((user_id = (select auth.uid())) AND private.post_read(post_id)));
alter policy "collaboration_read" on public."collaborations" using ((private.member() AND (NOT private.blocked(sender_id)) AND ((sender_id = (select auth.uid())) OR (EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = collaborations.project_id) AND (p.owner_id = (select auth.uid()))))))));
alter policy "appeal_read" on public."content_appeals" using (((user_id = (select auth.uid())) OR ((private.has_role('admin'::text) OR private.has_role('moderator'::text)) AND (EXISTS ( SELECT 1
   FROM posts p
  WHERE ((p.id = content_appeals.post_id) AND (p.visibility <> 'private'::text) AND ((p.project_id IS NULL) OR private.project_read(p.project_id))))))));
alter policy "contribution_read" on public."contributions" using ((user_id = (select auth.uid())));
alter policy "follows_read" on public."follows" using ((user_id = (select auth.uid())));
alter policy "applications_read" on public."membership_applications" using (((user_id = (select auth.uid())) OR private.has_role('reviewer'::text) OR private.has_role('admin'::text)));
alter policy "notifications_read" on public."notifications" using ((user_id = (select auth.uid())));
alter policy "paper_reports_read" on public."paper_reports" using (((user_id = (select auth.uid())) OR private.has_role('metadata_editor'::text) OR private.has_role('moderator'::text) OR private.has_role('admin'::text)));
alter policy "paper_saves_read" on public."paper_saves" using ((user_id = (select auth.uid())));
alter policy "posts_read" on public."posts" using ((private.post_read(id) OR (author_id = (select auth.uid())) OR ((private.has_role('moderator'::text) OR private.has_role('admin'::text)) AND (visibility <> 'private'::text) AND ((project_id IS NULL) OR private.project_read(project_id)))));
alter policy "preferences_read" on public."preferences" using ((user_id = (select auth.uid())));
alter policy "profiles_read" on public."profiles" using (((id = (select auth.uid())) OR private.has_role('admin'::text) OR ((membership = 'approved'::text) AND (NOT suspended) AND (NOT private.blocked(id)) AND ((visibility = 'public'::text) OR ((visibility = 'members'::text) AND private.member())))));
alter policy "project_images_read" on public."project_images" using ((private.member() AND private.project_read(project_id) AND (EXISTS ( SELECT 1
   FROM project_members m
  WHERE ((m.project_id = project_images.project_id) AND (m.user_id = (select auth.uid())))))));
alter policy "reports_read" on public."reports" using (((reporter_id = (select auth.uid())) OR private.has_role('moderator'::text) OR private.has_role('admin'::text)));
alter policy "role_read" on public."roles" using ((user_id = (select auth.uid())));
alter policy "subscriptions_read" on public."subscriptions" using (((user_id = (select auth.uid())) AND private.post_read(post_id)));
commit;
