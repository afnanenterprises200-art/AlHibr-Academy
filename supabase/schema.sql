-- Al-Hibr Academy database
-- Run this script in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  short_description text,
  description text,
  syllabus text,
  flyer_url text,
  video_url text,
  video_platform text default 'youtube',
  instructor text,
  duration text,
  fee numeric(12,2),
  published boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  content text not null,
  cover_url text,
  author text,
  category text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null default 'youtube',
  url text not null,
  thumbnail_url text,
  description text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  link_url text,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  academy_name text not null default 'Al-Hibr Academy',
  academy_name_urdu text not null default 'الحبر اکیڈمی',
  methodology text,
  youtube_url text,
  whatsapp_url text,
  contact_email text,
  updated_at timestamptz not null default now()
);

-- Public visitors can read published content only.
alter table public.courses enable row level security;
alter table public.articles enable row level security;
alter table public.media enable row level security;
alter table public.announcements enable row level security;
alter table public.site_settings enable row level security;

create policy "Public can read published courses"
on public.courses for select using (published = true);

create policy "Public can read published articles"
on public.articles for select using (published = true);

create policy "Public can read published media"
on public.media for select using (published = true);

create policy "Public can read published announcements"
on public.announcements for select using (published = true);

create policy "Public can read site settings"
on public.site_settings for select using (true);

-- Admin writes are intentionally NOT opened to the public anon key.
-- In the next admin step, authenticated admin access will be granted
-- through a dedicated role/claim and RLS policies.
