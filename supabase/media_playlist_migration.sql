alter table public.media
  add column if not exists playlist_title text;

create index if not exists media_playlist_title_idx
on public.media (playlist_title, created_at desc);
