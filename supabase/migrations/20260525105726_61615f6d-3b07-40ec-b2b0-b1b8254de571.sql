
-- REELS
create table public.reels (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  video_url text,
  thumbnail_url text,
  category text not null default 'general',
  duration_seconds integer default 30,
  expert_name text,
  likes_count integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.reels enable row level security;
create policy "reels public read" on public.reels for select using (true);

create table public.reel_likes (
  id uuid primary key default gen_random_uuid(),
  reel_id uuid not null references public.reels(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  unique(reel_id, user_id)
);
alter table public.reel_likes enable row level security;
create policy "reel likes read" on public.reel_likes for select using (true);
create policy "reel likes insert own" on public.reel_likes for insert with check (auth.uid() = user_id);
create policy "reel likes delete own" on public.reel_likes for delete using (auth.uid() = user_id);

-- COMMUNITY GROUPS
create table public.community_groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  member_count integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.community_groups enable row level security;
create policy "groups public read" on public.community_groups for select using (true);

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.community_groups(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  unique(group_id, user_id)
);
alter table public.group_members enable row level security;
create policy "members public read" on public.group_members for select using (true);
create policy "members insert own" on public.group_members for insert with check (auth.uid() = user_id);
create policy "members delete own" on public.group_members for delete using (auth.uid() = user_id);

-- POSTS
create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.community_groups(id) on delete cascade,
  user_id uuid not null,
  title text not null,
  body text not null,
  anonymous boolean not null default false,
  author_name text,
  likes_count integer not null default 0,
  comments_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.community_posts enable row level security;
create policy "posts public read" on public.community_posts for select using (true);
create policy "posts insert own" on public.community_posts for insert with check (auth.uid() = user_id);
create policy "posts update own" on public.community_posts for update using (auth.uid() = user_id);
create policy "posts delete own" on public.community_posts for delete using (auth.uid() = user_id);
create trigger trg_posts_touch before update on public.community_posts for each row execute function public.touch_updated_at();

create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null,
  body text not null,
  anonymous boolean not null default false,
  author_name text,
  created_at timestamptz not null default now()
);
alter table public.post_comments enable row level security;
create policy "comments public read" on public.post_comments for select using (true);
create policy "comments insert own" on public.post_comments for insert with check (auth.uid() = user_id);
create policy "comments delete own" on public.post_comments for delete using (auth.uid() = user_id);

create table public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);
alter table public.post_likes enable row level security;
create policy "post likes read" on public.post_likes for select using (true);
create policy "post likes insert own" on public.post_likes for insert with check (auth.uid() = user_id);
create policy "post likes delete own" on public.post_likes for delete using (auth.uid() = user_id);

create index on public.community_posts (group_id, created_at desc);
create index on public.post_comments (post_id, created_at);
create index on public.reels (created_at desc);
