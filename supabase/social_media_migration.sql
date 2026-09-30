-- Add social media links to site settings
alter table public.site_settings
  add column if not exists facebook_url text,
  add column if not exists instagram_url text,
  add column if not exists tiktok_url text;
