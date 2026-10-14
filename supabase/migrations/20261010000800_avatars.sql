create table public.avatars(user_id uuid primary key references public.profiles(id)on delete cascade,path text not null check(path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'),updated_at timestamptz not null default now());
alter table public.avatars enable row level security;
revoke all on public.avatars from public,anon,authenticated;grant select on public.avatars to authenticated;grant all on public.avatars to service_role;
create policy avatars_read on public.avatars for select to authenticated using(exists(select 1 from public.profiles p where p.id=user_id));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)values('avatars','avatars',false,524288,array['image/webp'])on conflict(id)do nothing;
-- Browser uploads and downloads remain denied. Edge checks RLS before issuing 60-second URLs.
create function public.avatar_budget()returns void language plpgsql security definer set search_path=''as $$begin if auth.uid()is null or exists(select 1 from public.profiles where id=auth.uid()and suspended)then raise insufficient_privilege;end if;perform private.rate_limit('avatar',3);end$$;
revoke all on function public.avatar_budget()from public,anon;grant execute on function public.avatar_budget()to authenticated;

create or replace function public.trust_metadata()returns jsonb language sql stable security invoker set search_path=''as $$select jsonb_build_object('taxonomy',(select coalesce(jsonb_agg(name order by name),'[]')from public.topics),'point_rules',(select coalesce(jsonb_agg(x),'[]')from public.contribution_rules x),'subscriptions',(select coalesce(jsonb_agg(x),'[]')from(select *from public.subscriptions limit 100)x),'contribution_total',(select coalesce(sum(points),0)from public.contributions where valid and user_id=auth.uid()))$$;
