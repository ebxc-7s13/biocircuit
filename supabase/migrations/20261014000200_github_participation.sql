-- Public preview participation without paid SMS (owner decision 2026-10-14):
-- an identity created by Supabase Auth's GitHub OAuth provider counts as the
-- identity check, and membership is approved automatically (no academic review
-- in this preview). Only Auth can insert into auth.identities, so clients cannot
-- trigger this. Staff decisions (rejected/appeal) and suspensions are never
-- overridden. Reversible: drop trigger auth_github_participation.
create function private.approve_github_identity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles
     set membership = 'approved'
   where id = new.user_id
     and not suspended
     and membership in ('not_submitted', 'pending', 'needs_evidence', 'expired');
  if found then
    insert into public.audit(actor_id, action, target_id, reason)
    values (null, 'membership_auto_github', new.user_id::text,
            'Automatic preview approval after GitHub OAuth identity');
  end if;
  return new;
end
$$;
revoke all on function private.approve_github_identity() from public, anon, authenticated;

create trigger auth_github_participation
after insert on auth.identities
for each row when (new.provider = 'github')
execute function private.approve_github_identity();
