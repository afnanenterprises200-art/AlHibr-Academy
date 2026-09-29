-- Run once in Supabase SQL Editor AFTER the original schema.sql.
-- This migration creates the secure admin role and storage for flyers/covers.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;

-- Bootstrap: if the project currently has exactly one Auth user, make that
-- existing user the first admin. This avoids putting an email/password in code.
do $$
declare c integer; uid uuid;
begin
  select count(*), min(id) into c, uid from auth.users;
  if c = 1 and uid is not null then
    insert into public.admin_users(user_id) values(uid) on conflict do nothing;
  end if;
end $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.admin_users where user_id=auth.uid()) $$;

drop policy if exists "Admins can read admin_users" on public.admin_users;
create policy "Admins can read admin_users" on public.admin_users for select to authenticated using (public.is_admin());

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='courses' and policyname='Admins manage courses') then
    create policy "Admins manage courses" on public.courses for all to authenticated using (public.is_admin()) with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='articles' and policyname='Admins manage articles') then
    create policy "Admins manage articles" on public.articles for all to authenticated using (public.is_admin()) with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='media' and policyname='Admins manage media') then
    create policy "Admins manage media" on public.media for all to authenticated using (public.is_admin()) with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='announcements' and policyname='Admins manage announcements') then
    create policy "Admins manage announcements" on public.announcements for all to authenticated using (public.is_admin()) with check (public.is_admin());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='site_settings' and policyname='Admins manage settings') then
    create policy "Admins manage settings" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
  end if;
end $$;

insert into public.site_settings(id,academy_name,academy_name_urdu,methodology,youtube_url)
values(1,'Al-Hibr Academy','الحبر اکیڈمی','The Qur''an and the Sunnah upon the understanding of the righteous predecessors (Salaf of the Ummah).','https://youtube.com/@alhibracademyislamic')
on conflict(id) do nothing;

insert into storage.buckets(id,name,public)
values('academy-media','academy-media',true)
on conflict(id) do nothing;

drop policy if exists "Public can view academy media" on storage.objects;
create policy "Public can view academy media" on storage.objects for select using (bucket_id='academy-media');

drop policy if exists "Admins can upload academy media" on storage.objects;
create policy "Admins can upload academy media" on storage.objects for insert to authenticated with check (bucket_id='academy-media' and public.is_admin());

drop policy if exists "Admins can update academy media" on storage.objects;
create policy "Admins can update academy media" on storage.objects for update to authenticated using (bucket_id='academy-media' and public.is_admin()) with check (bucket_id='academy-media' and public.is_admin());

drop policy if exists "Admins can delete academy media" on storage.objects;
create policy "Admins can delete academy media" on storage.objects for delete to authenticated using (bucket_id='academy-media' and public.is_admin());
