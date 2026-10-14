create or replace function public.search_community(search_text text,page_cursor jsonb default '{}')returns jsonb language sql stable security invoker set search_path=''as $$with
matching_posts as(select *from public.posts where length(search_text)between 2 and 200 and not(page_cursor ? 'posts' and page_cursor->>'posts' is null) and(id>coalesce((page_cursor->>'posts')::uuid,'00000000-0000-0000-0000-000000000000'::uuid))and search_vector@@websearch_to_tsquery('english',search_text)order by id limit 30),
matching_profiles as(select *from public.profiles where length(search_text)between 2 and 200 and not(page_cursor ? 'profiles' and page_cursor->>'profiles' is null) and(id>coalesce((page_cursor->>'profiles')::uuid,'00000000-0000-0000-0000-000000000000'::uuid))and to_tsvector('english',name||' '||methods||' '||equipment||' '||array_to_string(interests,' '))@@websearch_to_tsquery('english',search_text)order by id limit 30),
matching_projects as(select *from public.projects where length(search_text)between 2 and 200 and not(page_cursor ? 'projects' and page_cursor->>'projects' is null) and(id>coalesce((page_cursor->>'projects')::uuid,'00000000-0000-0000-0000-000000000000'::uuid))and to_tsvector('english',title||' '||problem||' '||methods||' '||needs||' '||equipment)@@websearch_to_tsquery('english',search_text)order by id limit 30)
select jsonb_build_object('posts',(select coalesce(jsonb_agg(x order by id),'[]')from matching_posts x),'profiles',(select coalesce(jsonb_agg(x order by id),'[]')from matching_profiles x),'projects',(select coalesce(jsonb_agg(x order by id),'[]')from matching_projects x),'cursor',jsonb_build_object('posts',(select case when count(*)=30 then max(id::text)else null end from matching_posts),'profiles',(select case when count(*)=30 then max(id::text)else null end from matching_profiles),'projects',(select case when count(*)=30 then max(id::text)else null end from matching_projects)))$$;
revoke all on function public.search_community(text,jsonb)from public;grant execute on function public.search_community(text,jsonb)to anon,authenticated;

-- Privileged service access is explicit; never put this key in a browser.
grant all on all tables in schema public to service_role;
create or replace function private.has_role(r text)returns boolean language sql stable security definer set search_path=''as $$select exists(select 1 from public.roles x join public.profiles p on p.id=x.user_id where x.user_id=auth.uid()and x.role=r and not p.suspended)$$;
alter table public.contributions add column created_at timestamptz not null default now();
create index contribution_daily_idx on public.contributions(user_id,created_at desc);
-- Serialize per-recipient award checks, cap first-time awards, and limit repeated pairs.
-- Caps count invalidated events too, so reopening/removing cannot bypass the budget.
create function private.guard_contribution()returns trigger language plpgsql security definer set search_path=''as $$declare asker uuid;begin
 if exists(select 1 from public.contributions where source_id=new.source_id and kind=new.kind)then return new;end if;
 perform pg_advisory_xact_lock(hashtextextended(new.user_id::text,0));
 select p.author_id into asker from public.comments c join public.posts p on p.id=c.post_id where c.id=new.source_id;
 if asker=new.user_id then raise insufficient_privilege;end if;
 if(select count(*)from public.contributions where user_id=new.user_id and created_at>now()-interval '1 day')>=5 then raise exception 'Contribution award limit reached';end if;
 if exists(select 1 from public.contributions x join public.comments c on c.id=x.source_id join public.posts p on p.id=c.post_id where x.user_id=new.user_id and p.author_id=asker and x.created_at>now()-interval '1 day')then raise exception 'Repeated pair award limit reached';end if;
 return new;end$$;
revoke all on function private.guard_contribution()from public;
create trigger contribution_budget before insert on public.contributions for each row execute function private.guard_contribution();
-- Exact counts and own interaction states for older direct links, without private leakage.
create function public.discussion_interactions(pid uuid)returns jsonb language sql stable security invoker set search_path=''as $$select jsonb_build_object(
 'reactions',(select coalesce(jsonb_agg(x),'[]')from(select *from public.reactions where post_id=pid and user_id=auth.uid())x),
 'helpful',(select coalesce(jsonb_agg(x),'[]')from(select h.*from public.helpful h join public.comments c on c.id=h.comment_id where c.post_id=pid and h.user_id=auth.uid())x),
 'bookmarks',(select coalesce(jsonb_agg(x),'[]')from(select *from public.bookmarks where post_id=pid)x),
 'counts',jsonb_build_object('reaction_count',(select count(*)from public.reactions where post_id=pid),'reply_count',(select count(*)from public.comments where post_id=pid)),
 'helpful_counts',(select coalesce(jsonb_object_agg(comment_id,n),'{}')from(select h.comment_id,count(*)n from public.helpful h join public.comments c on c.id=h.comment_id where c.post_id=pid group by h.comment_id)x))$$;
revoke all on function public.discussion_interactions(uuid)from public;grant execute on function public.discussion_interactions(uuid)to authenticated;

create function public.discussion_page(pid uuid,after_time timestamptz default null,after_id uuid default null)returns jsonb language sql stable security invoker set search_path=''as $$with page as(select *from public.comments where post_id=pid and(after_time is null or(created_at,id)>(after_time,after_id))order by created_at,id limit 50)select jsonb_build_object('comments',(select coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('helpful_count',(select count(*)from public.helpful where comment_id=x.id))order by created_at,id),'[]')from page x),'profiles',(select coalesce(jsonb_agg(x),'[]')from public.profiles x where id in(select author_id from page)))$$;
revoke all on function public.discussion_page(uuid,timestamptz,uuid)from public;grant execute on function public.discussion_page(uuid,timestamptz,uuid)to anon,authenticated;
create function public.discovery_page(entity text,after_id uuid default null)returns jsonb language sql stable security invoker set search_path=''as $$select case when entity='profiles'then jsonb_build_object('profiles',(select coalesce(jsonb_agg(x order by id),'[]')from(select *from public.profiles where(after_id is null or id>after_id)order by id limit 50)x))when entity='projects'then jsonb_build_object('projects',(select coalesce(jsonb_agg(x order by id),'[]')from(select *from public.projects where not archived and(after_id is null or id>after_id)order by id limit 50)x))else '{}'::jsonb end$$;
revoke all on function public.discovery_page(text,uuid)from public;grant execute on function public.discovery_page(text,uuid)to anon,authenticated;
