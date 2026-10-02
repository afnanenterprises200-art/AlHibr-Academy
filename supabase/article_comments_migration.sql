create table if not exists public.article_comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  name text not null default 'Anonymous',
  comment text not null,
  approved boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.article_comments enable row level security;

drop policy if exists "Public can read approved article comments" on public.article_comments;
create policy "Public can read approved article comments"
on public.article_comments for select
using (approved = true);

drop policy if exists "Anyone can post article comments" on public.article_comments;
create policy "Anyone can post article comments"
on public.article_comments for insert
to anon, authenticated
with check (approved = true);

create index if not exists article_comments_article_idx
on public.article_comments(article_id, created_at);
