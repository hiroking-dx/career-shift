-- Run in the owner's Supabase SQL Editor. This script grants no browser role
-- direct table access. The owner is explicitly enrolled separately.
begin;
create schema if not exists career_private;
revoke all on schema career_private from public, anon, authenticated;
create table if not exists career_private.owner (
 singleton boolean primary key default true check(singleton),
 user_id uuid not null unique references auth.users(id)
);
create table if not exists career_private.versions (
 rev bigint primary key, payload jsonb not null,
 saved_at timestamptz not null default now()
);
alter table career_private.owner enable row level security;
create table if not exists career_private.invitation (
 singleton boolean primary key default true check(singleton), email text not null
);
alter table career_private.invitation enable row level security;
alter table career_private.versions enable row level security;
revoke all on all tables in schema career_private from public, anon, authenticated;

create or replace function career_private.check_owner() returns void
language plpgsql security definer set search_path = '' as $$
begin
 if coalesce(auth.jwt()->'app_metadata'->>'provider','') <> 'google'
 then raise exception 'Owner authorization required' using errcode='42501'; end if;
 if not exists(select from career_private.owner where user_id=auth.uid()) then
  insert into career_private.owner(user_id)
  select i.user_id from auth.identities i join career_private.invitation a
   on lower(i.identity_data->>'email')=lower(a.email)
  where i.user_id=auth.uid() and i.provider='google'
   and i.identity_data->>'email_verified'='true' on conflict do nothing;
 end if;
 if not exists(select from career_private.owner where user_id=auth.uid())
 then raise exception 'Owner authorization required' using errcode='42501'; end if;
end $$;
revoke all on function career_private.check_owner() from public,anon,authenticated;

create or replace function public.career_read(known_rev bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
 perform career_private.check_owner();
 select jsonb_build_object('rev',v.rev,'payload',case when v.rev<>known_rev then v.payload end)
 into result from career_private.versions v order by v.rev desc limit 1;
 return coalesce(result,jsonb_build_object('rev',0,'payload',null));
end $$;

create or replace function public.career_write(expected_rev bigint, document jsonb)
returns bigint language plpgsql security definer set search_path = '' as $$
declare current_rev bigint;
begin
 perform career_private.check_owner();
 perform 1 from career_private.owner where singleton for update;
 select coalesce(max(rev),0) into current_rev from career_private.versions;
 if expected_rev is distinct from current_rev then raise exception 'revision conflict' using errcode='40001'; end if;
 if document is null or jsonb_typeof(document) is distinct from 'object'
 or document->>'version' is distinct from '2' or jsonb_typeof(document->'rows') is distinct from 'object'
 or octet_length(document::text)>3145728 then raise exception 'Invalid or oversized snapshot' using errcode='22023'; end if;
 insert into career_private.versions(rev,payload) values(current_rev+1,document);
 delete from career_private.versions where rev<=current_rev-9;
 return current_rev+1;
end $$;
revoke all on function public.career_read(bigint),public.career_write(bigint,jsonb) from public,anon;
grant execute on function public.career_read(bigint),public.career_write(bigint,jsonb) to authenticated;
commit;
