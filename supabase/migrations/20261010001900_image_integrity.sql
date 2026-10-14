-- Recheck current membership at commit time after the external processor returns.
create function private.project_image_integrity()returns trigger language plpgsql security definer set search_path=''as $$begin
perform 1 from public.profiles where id=new.user_id and membership='approved'and not suspended for share;
if not found then raise insufficient_privilege;end if;
perform 1 from public.project_members where project_id=new.project_id and user_id=new.user_id for share;
if not found or new.path<>new.user_id::text||'/'||new.id::text||'.png' then raise insufficient_privilege;end if;
return new;end$$;
revoke all on function private.project_image_integrity()from public;
create trigger project_image_integrity before insert or update on public.project_images for each row execute function private.project_image_integrity();
