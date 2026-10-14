create function public.community_action(action_type text,payload jsonb,request_id uuid) returns void language plpgsql security definer set search_path='' as $$
<<operation>>
declare uid uuid:=auth.uid(); pid uuid; target uuid; cid uuid; appid uuid; pt public.posts%rowtype; pr public.projects%rowtype; cm public.comments%rowtype; ap public.membership_applications%rowtype; cr public.collaborations%rowtype; tags text[]; interests text[]; muted text[]; st text; pap jsonb; existing_action text;
begin
 if uid is null then raise insufficient_privilege;end if;
 if pg_column_size(payload)>24000 or jsonb_typeof(payload)<>'object' then raise exception 'Invalid payload';end if;
 if exists(select 1 from public.profiles where id=uid and suspended)then raise insufficient_privilege;end if;
 -- Requests are deduplicated transactionally. A failed operation rolls back its receipt.
 insert into private.action_receipts(user_id,request_id,action)values(uid,request_id,action_type)on conflict do nothing;
 if not found then select action into existing_action from private.action_receipts where user_id=uid and private.action_receipts.request_id=community_action.request_id;if existing_action<>action_type then raise exception 'Invalid request reuse';end if;return;end if;
 perform private.rate_limit('all',60);
 pid:=nullif(payload->>'post_id','')::uuid;target:=nullif(payload->>'target_id','')::uuid;cid:=nullif(payload->>'comment_id','')::uuid;
 if pid is not null then select * into pt from public.posts where id=pid for update;end if;
 if payload->>'project_id' is not null then select * into pr from public.projects where id=(payload->>'project_id')::uuid for update;end if;
 if cid is not null then select * into cm from public.comments where id=cid for update;end if;
 tags:=array(select jsonb_array_elements_text(coalesce(payload->'tags','[]')));interests:=array(select jsonb_array_elements_text(coalesce(payload->'interests','[]')));muted:=array(select jsonb_array_elements_text(coalesce(payload->'muted','[]')));
 if exists(select 1 from unnest(tags||interests||muted) t where length(t) not between 1 and 60)then raise exception 'Invalid topic';end if;
 if action_type='profile' then
 update public.profiles set name=trim(payload->>'name'),handle=payload->>'handle',institution=coalesce(payload->>'institution',''),degree=coalesce(payload->>'degree',''),bio=coalesce(payload->>'bio',''),methods=coalesce(payload->>'methods',''),equipment=coalesce(payload->>'equipment',''),interests=operation.interests,available=coalesce((payload->>'available')::boolean,false),visibility=payload->>'visibility' where id=uid;
 if length(trim(payload->>'name'))<2 then raise exception 'Invalid name';end if;return;
 elsif action_type='application' then
 if not exists(select 1 from public.profiles where id=uid and phone_verified)then raise insufficient_privilege;end if;
 if exists(select 1 from public.membership_applications where user_id=uid and status in('approved','pending','appeal'))then raise exception 'Application unavailable';end if;
 perform private.rate_limit('application',3);
 insert into public.membership_applications(user_id,institution,degree,discipline,result_status,year,private_marks)values(uid,payload->>'institution',payload->>'degree',payload->>'discipline',payload->>'result_status',(payload->>'year')::integer,coalesce(payload->>'private_marks',''))on conflict(user_id)do update set institution=excluded.institution,degree=excluded.degree,discipline=excluded.discipline,result_status=excluded.result_status,year=excluded.year,private_marks=excluded.private_marks,status='pending',reason='',reviewer_id=null,decided_at=null;
 update public.profiles set membership='pending' where id=uid;return;
 elsif action_type='appeal' then
 update public.membership_applications set status='appeal',reason=payload->>'reason' where user_id=uid and status in('rejected','expired');if not found or length(payload->>'reason')<5 then raise exception 'Appeal unavailable';end if;update public.profiles set membership='appeal' where id=uid;return;
 elsif action_type='preferences' then
 insert into public.preferences(user_id,interests,muted,in_app,email,digest)values(uid,interests,muted,coalesce((payload->>'in_app')::boolean,true),false,'none')on conflict(user_id)do update set interests=excluded.interests,muted=excluded.muted,in_app=excluded.in_app;return;
 elsif action_type='read_notifications' then update public.notifications set read=true where user_id=uid;return;
 elsif action_type='review' then
 if not(private.has_role('reviewer')or private.has_role('admin'))then raise insufficient_privilege;end if;
 appid:=(payload->>'application_id')::uuid;select * into ap from public.membership_applications where id=appid for update;st:=payload->>'status';
 if ap.id is null or ap.user_id=uid or st not in('approved','rejected','needs_evidence','expired')or length(payload->>'reason')not between 5 and 1000 then raise exception 'Invalid review';end if;
 update public.membership_applications set status=st,reason=payload->>'reason',reviewer_id=uid,decided_at=now() where id=appid;update public.profiles set membership=st where id=ap.user_id;
 insert into public.audit(actor_id,action,target_id,reason)values(uid,'membership_'||st,appid::text,payload->>'reason');perform private.notify(ap.user_id,request_id::text,'membership','Membership decision: '||st,'/profile');return;
 elsif action_type='suspend' then
 if not private.has_role('admin')or target=uid then raise insufficient_privilege;end if;
 update public.profiles set suspended=(payload->>'suspended')::boolean where id=target;insert into public.audit(actor_id,action,target_id,reason)values(uid,'suspension',target::text,payload->>'reason');return;
 elsif action_type='moderate' then
 if not(private.has_role('moderator')or private.has_role('admin'))or pt.id is null or pt.visibility='private' then raise insufficient_privilege;end if;
 update public.posts set state=case when payload->>'state'='published'then'published'else'removed'end where id=pid;update public.reports set status='reviewed' where id=(payload->>'report_id')::uuid and post_id=pid;
 update public.contributions set valid=false where source_id in(select id from public.comments where post_id=pid)and payload->>'state'<>'published';insert into public.audit(actor_id,action,target_id,reason)values(uid,'moderate',pid::text,payload->>'reason');return;
 end if;
 if not private.member()then raise insufficient_privilege;end if;
 -- Check object access BEFORE applying any member action, even when guessing an ID.
 if pid is not null and not private.post_read(pid)then raise insufficient_privilege;end if;
 if cid is not null and(cm.id is null or not private.post_read(cm.post_id)or private.blocked(cm.author_id))then raise insufficient_privilege;end if;
 if target is not null and action_type<>'block' and(private.blocked(target)or not exists(select 1 from public.profiles where id=target and membership='approved'and not suspended))then raise insufficient_privilege;end if;
 if action_type in('post','edit_post')then
 perform private.rate_limit('publish',5);
 if payload->>'project_id' is not null and not exists(select 1 from public.project_members where project_id=(payload->>'project_id')::uuid and user_id=uid)then raise insufficient_privilege;end if;
 if action_type='edit_post' then
 if pt.author_id<>uid or pt.id is null then raise insufficient_privilege;end if;
 update public.posts set kind=payload->>'kind',title=trim(payload->>'title'),body=trim(payload->>'body'),tags=operation.tags,visibility=payload->>'visibility',source_url=coalesce(payload->>'source_url',''),methods=coalesce(payload->>'methods',''),tried=coalesce(payload->>'tried',''),log_type=coalesce(payload->>'log_type','note'),project_id=(payload->>'project_id')::uuid,paper_id=payload->>'paper_id',updated_at=now() where id=pid;
 else
 insert into public.posts(id,author_id,kind,title,body,tags,visibility,source_url,methods,tried,project_id,paper_id,log_type)values(request_id,uid,payload->>'kind',trim(payload->>'title'),trim(payload->>'body'),tags,payload->>'visibility',coalesce(payload->>'source_url',''),coalesce(payload->>'methods',''),coalesce(payload->>'tried',''),(payload->>'project_id')::uuid,payload->>'paper_id',coalesce(payload->>'log_type','note'));end if;
 elsif action_type='comment' then
 perform private.rate_limit('comment',10);insert into public.comments(id,post_id,author_id,body)values(request_id,pid,uid,trim(payload->>'body'));perform private.notify(pt.author_id,request_id::text,'reply','New reply: '||pt.title,'/post/'||pid::text);perform private.notify(s.user_id,request_id::text,'reply','New reply to a subscribed discussion','/post/'||pid::text)from public.subscriptions s where s.post_id=pid and s.user_id<>pt.author_id;
 elsif action_type='delete_comment' then
 if cm.author_id<>uid then raise insufficient_privilege;end if;delete from public.comments where id=cid;
 elsif action_type='accept' then
 if pt.kind<>'question'or not(pt.author_id=uid or private.has_role('moderator')or private.has_role('admin')) or cm.post_id<>pid or cm.author_id=uid or cm.author_id=pt.author_id or cm.id is null then raise insufficient_privilege;end if;
 update public.contributions set valid=false where source_id=pt.accepted_answer_id;update public.posts set accepted_answer_id=cid where id=pid;
 insert into public.contributions(user_id,source_id,kind,points)values(cm.author_id,cid,'accepted_answer',coalesce((select points from public.contribution_rules where kind='accepted_answer'),20))on conflict(source_id,kind)do update set valid=true;
 perform private.notify(cm.author_id,'accepted:'||cid::text,'accepted','Your answer was accepted','/post/'||pid::text);
 elsif action_type='resolve' then
 if pt.author_id<>uid or pt.kind<>'question' then raise insufficient_privilege;end if;update public.posts set resolution=coalesce(payload->>'resolution',''),accepted_answer_id=case when coalesce(payload->>'resolution','')=''then null else accepted_answer_id end where id=pid;
 if coalesce(payload->>'resolution','')=''then update public.contributions set valid=false where source_id=pt.accepted_answer_id;end if;
 elsif action_type='reaction' then
 if pt.author_id=uid or pt.id is null then raise insufficient_privilege;end if;delete from public.reactions where user_id=uid and post_id=pid;if not found then insert into public.reactions values(uid,pid);end if;
 elsif action_type='bookmark' then
 if pt.id is null then raise insufficient_privilege;end if;delete from public.bookmarks where user_id=uid and post_id=pid;if not found then insert into public.bookmarks values(uid,pid);end if;
 elsif action_type='helpful' then
 if cm.author_id=uid or cm.id is null then raise insufficient_privilege;end if;delete from public.helpful where user_id=uid and comment_id=cid;if not found then insert into public.helpful values(uid,cid);end if;
 elsif action_type='follow' then
 if target=uid then raise insufficient_privilege;end if;delete from public.follows where user_id=uid and target_id=target;if not found then insert into public.follows values(uid,target);end if;
 elsif action_type='block' then
 if target=uid then raise insufficient_privilege;end if;delete from public.blocks where user_id=uid and target_id=target;if not found then insert into public.blocks values(uid,target);delete from public.follows where(user_id=uid and target_id=target)or(user_id=target and target_id=uid);end if;
 elsif action_type='report' then
 perform private.rate_limit('report',3);insert into public.reports(reporter_id,post_id,reason)values(uid,pid,payload->>'reason')on conflict(reporter_id,post_id)where status='open'do nothing;
 elsif action_type='delete_post' then
 if pt.author_id<>uid then raise insufficient_privilege;end if;update public.posts set state='removed' where id=pid;update public.contributions set valid=false where source_id in(select id from public.comments where post_id=pid);
 elsif action_type in('project','edit_project')then
 perform private.rate_limit('project',3);
 if action_type='project' then
 insert into public.projects(id,owner_id,title,problem,stage,methods,equipment,needs,tags,visibility,source_url,license,governance)values(request_id,uid,payload->>'title',payload->>'problem',payload->>'stage',coalesce(payload->>'methods',''),coalesce(payload->>'equipment',''),coalesce(payload->>'needs',''),tags,payload->>'visibility',coalesce(payload->>'source_url',''),coalesce(payload->>'license',''),payload->>'governance');insert into public.project_members values(request_id,uid,'Owner');
 else
 if pr.owner_id<>uid or pr.id is null then raise insufficient_privilege;end if;
 update public.projects set title=payload->>'title',problem=payload->>'problem',stage=payload->>'stage',methods=coalesce(payload->>'methods',''),equipment=coalesce(payload->>'equipment',''),needs=coalesce(payload->>'needs',''),tags=operation.tags,visibility=payload->>'visibility',source_url=coalesce(payload->>'source_url',''),license=coalesce(payload->>'license',''),governance=payload->>'governance' where id=pr.id;end if;
 elsif action_type in('archive_project','remove_member','transfer_project')then
 if pr.id is null or pr.owner_id<>uid then raise insufficient_privilege;end if;
 if action_type='archive_project'then update public.projects set archived=not archived where id=pr.id;
 elsif action_type='remove_member'then if target=uid then raise insufficient_privilege;end if;delete from public.project_members where project_id=pr.id and user_id=target;
 else if not exists(select 1 from public.project_members where project_id=pr.id and user_id=target)then raise insufficient_privilege;end if;update public.project_members set role='Collaborator'where project_id=pr.id and user_id=uid;update public.project_members set role='Owner'where project_id=pr.id and user_id=target;update public.projects set owner_id=target where id=pr.id;end if;
 elsif action_type='collaborate' then
 if pr.id is null or pr.owner_id=uid or pr.archived or not private.project_read(pr.id)or private.blocked(pr.owner_id)then raise insufficient_privilege;end if;perform private.rate_limit('collaboration',3);
 insert into public.collaborations(id,project_id,sender_id,message,expertise,availability)values(request_id,pr.id,uid,payload->>'message',coalesce(payload->>'expertise',''),coalesce(payload->>'availability',''))on conflict(project_id,sender_id)where status='pending'do nothing;perform private.notify(pr.owner_id,'collaboration:'||pr.id::text||':'||uid::text,'collaboration','New collaboration request','/project/'||pr.id::text);
 elsif action_type='decide_collaboration' then
 select * into cr from public.collaborations where id=(payload->>'collaboration_id')::uuid for update;
 if pr.id is null or pr.owner_id<>uid or cr.project_id<>pr.id or cr.status<>'pending'or private.blocked(cr.sender_id)then raise insufficient_privilege;end if;
 st:=case when(payload->>'accept')::boolean then'accepted'else'declined'end;update public.collaborations set status=st where id=cr.id;if st='accepted'then insert into public.project_members values(pr.id,cr.sender_id,'Collaborator')on conflict do nothing;end if;perform private.notify(cr.sender_id,'decision:'||cr.id::text,'collaboration','Collaboration '||st,'/project/'||pr.id::text);
 elsif action_type='paper'then
 pap:=payload->'paper';if not exists(select 1 from public.papers where id=pap->>'id')then raise exception 'Fetch sourced metadata first';end if;insert into public.paper_saves values(uid,pap->>'id')on conflict do nothing;
 else raise exception 'Unsupported action';end if;
end$$;
revoke all on function public.community_action(text,jsonb,uuid) from public,anon;
grant execute on function public.community_action(text,jsonb,uuid) to authenticated;

-- Invoker snapshot: each subquery is independently filtered by RLS. Never returns auth.users.
create function public.community_snapshot(before_cursor text default null) returns jsonb language sql stable security invoker set search_path='' as $$
with page as(select * from public.posts where before_cursor is null or(created_at,id)<(split_part(before_cursor,'|',1)::timestamptz,split_part(before_cursor,'|',2)::uuid)order by created_at desc,id desc limit 30)
select jsonb_build_object(
'profiles',(select coalesce(jsonb_agg(x),'[]')from(select * from public.profiles order by id limit 100)x),
'posts',(select coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('reaction_count',(select count(*)from public.reactions where post_id=x.id),'reply_count',(select count(*)from public.comments where post_id=x.id))order by x.created_at desc,x.id desc),'[]')from page x),
'comments',(select coalesce(jsonb_agg(x),'[]')from(select * from public.comments where post_id in(select id from page)order by created_at limit 300)x),
'projects',(select coalesce(jsonb_agg(x),'[]')from(select * from public.projects order by created_at desc limit 50)x),
'project_members',(select coalesce(jsonb_agg(x),'[]')from(select * from public.project_members limit 300)x),
'collaborations',(select coalesce(jsonb_agg(x),'[]')from(select * from public.collaborations order by created_at desc limit 100)x),
'papers',(select coalesce(jsonb_agg(x),'[]')from(select p.* from public.papers p join public.paper_saves s on s.paper_id=p.id where s.user_id=auth.uid()limit 50)x),
'applications',(select coalesce(jsonb_agg(x),'[]')from(select * from public.membership_applications order by created_at limit 100)x),
'notifications',(select coalesce(jsonb_agg(x),'[]')from(select id,user_id,category,text,path,read,created_at from public.notifications order by created_at desc limit 100)x),
'reports',(select coalesce(jsonb_agg(x),'[]')from(select * from public.reports order by created_at desc limit 100)x),
'contributions',(select coalesce(jsonb_agg(x),'[]')from(select * from public.contributions limit 100)x),
'audit',(select coalesce(jsonb_agg(x),'[]')from(select * from public.audit order by created_at desc limit 100)x),
'preferences',(select coalesce(jsonb_agg(x),'[]')from public.preferences x),
'reactions',(select coalesce(jsonb_agg(x),'[]')from(select * from public.reactions where post_id in(select id from page)limit 500)x),
'bookmarks',(select coalesce(jsonb_agg(x),'[]')from(select * from public.bookmarks limit 100)x),
'follows',(select coalesce(jsonb_agg(x),'[]')from(select * from public.follows limit 100)x),
'blocks',(select coalesce(jsonb_agg(x),'[]')from(select * from public.blocks limit 100)x),
'helpful',(select coalesce(jsonb_agg(x),'[]')from(select * from public.helpful limit 500)x),
'roles',(select coalesce(jsonb_agg(x),'[]')from public.roles x))$$;
revoke all on function public.community_snapshot(text) from public;
grant execute on function public.community_snapshot(text) to authenticated;
-- Anonymous snapshot omits private table reads (no blanket anon grants).
create function public.public_snapshot()returns jsonb language sql stable security invoker set search_path=''as $$select jsonb_build_object('profiles',(select coalesce(jsonb_agg(x),'[]')from(select * from public.profiles limit 50)x),'posts',(select coalesce(jsonb_agg(to_jsonb(x)||jsonb_build_object('reaction_count',(select count(*)from public.reactions where post_id=x.id),'reply_count',(select count(*)from public.comments where post_id=x.id))),'[]')from(select * from public.posts order by created_at desc,id desc limit 30)x),'projects',(select coalesce(jsonb_agg(x),'[]')from(select * from public.projects limit 30)x),'comments','[]'::jsonb,'project_members','[]'::jsonb,'papers','[]'::jsonb,'collaborations','[]'::jsonb,'applications','[]'::jsonb,'notifications','[]'::jsonb,'reports','[]'::jsonb,'contributions','[]'::jsonb,'audit','[]'::jsonb,'preferences','[]'::jsonb,'reactions','[]'::jsonb,'bookmarks','[]'::jsonb,'follows','[]'::jsonb,'blocks','[]'::jsonb,'helpful','[]'::jsonb,'roles','[]'::jsonb)$$;
revoke all on function public.public_snapshot()from public;grant execute on function public.public_snapshot()to anon,authenticated;
create function public.export_personal_data()returns jsonb language plpgsql security definer set search_path=''as $$declare uid uuid:=auth.uid();begin if uid is null then raise insufficient_privilege;end if;return jsonb_build_object('profile',(select to_jsonb(p)from public.profiles p where id=uid),'application',(select to_jsonb(a)from public.membership_applications a where user_id=uid),'posts',(select coalesce(jsonb_agg(p),'[]')from public.posts p where author_id=uid),'comments',(select coalesce(jsonb_agg(c),'[]')from public.comments c where author_id=uid),'preferences',(select to_jsonb(p)from public.preferences p where user_id=uid),'bookmarks',(select coalesce(jsonb_agg(b),'[]')from public.bookmarks b where user_id=uid),'projects',(select coalesce(jsonb_agg(p),'[]')from public.projects p where owner_id=uid),'collaborations',(select coalesce(jsonb_agg(c),'[]')from public.collaborations c where sender_id=uid),'notifications',(select coalesce(jsonb_agg(n),'[]')from public.notifications n where user_id=uid),'reports',(select coalesce(jsonb_agg(r),'[]')from public.reports r where reporter_id=uid),'contributions',(select coalesce(jsonb_agg(c),'[]')from public.contributions c where user_id=uid));end$$;
revoke all on function public.export_personal_data()from public,anon;grant execute on function public.export_personal_data()to authenticated;
