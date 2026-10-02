create table if not exists public.article_likes (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  visitor_id uuid not null,
  created_at timestamptz not null default now(),
  unique(article_id, visitor_id)
);

alter table public.article_likes enable row level security;

drop policy if exists "Public can read article likes" on public.article_likes;
create policy "Public can read article likes"
on public.article_likes for select
to anon, authenticated
using (true);

drop policy if exists "Anyone can add article likes" on public.article_likes;
create policy "Anyone can add article likes"
on public.article_likes for insert
to anon, authenticated
with check (true);

drop policy if exists "Anyone can remove own article likes" on public.article_likes;
create policy "Anyone can remove own article likes"
on public.article_likes for delete
to anon, authenticated
using (true);

create index if not exists article_likes_article_idx
on public.article_likes(article_id, created_at);