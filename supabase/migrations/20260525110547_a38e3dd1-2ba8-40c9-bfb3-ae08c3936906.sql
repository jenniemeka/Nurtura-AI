
-- 1. ROLES
create type public.app_role as enum ('admin', 'expert', 'parent');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "roles self read" on public.user_roles for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "roles admin write" on public.user_roles for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- 2. EXPERT APPLICATIONS
create table public.expert_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  full_name text not null,
  title text not null,
  bio text not null,
  credentials text not null,
  specialties text[] not null default '{}',
  status text not null default 'pending', -- pending | approved | rejected
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.expert_applications enable row level security;
create trigger trg_expapp_touch before update on public.expert_applications for each row execute function public.touch_updated_at();

create policy "expapp self read" on public.expert_applications for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "expapp self insert" on public.expert_applications for insert with check (auth.uid() = user_id);
create policy "expapp self update pending" on public.expert_applications for update using (auth.uid() = user_id and status = 'pending') with check (auth.uid() = user_id);
create policy "expapp admin update" on public.expert_applications for update using (public.has_role(auth.uid(), 'admin'));

-- 3. EXPERT PROFILES (public)
create table public.expert_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  display_name text not null,
  title text not null,
  bio text not null,
  avatar_url text,
  specialties text[] not null default '{}',
  verified boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.expert_profiles enable row level security;
create policy "experts public read" on public.expert_profiles for select using (true);
create policy "experts self update" on public.expert_profiles for update using (auth.uid() = user_id);
create policy "experts admin write" on public.expert_profiles for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- 4. CONTENT MODERATION FIELDS
alter table public.articles
  add column author_id uuid,
  add column moderation_status text not null default 'approved';
alter table public.reels
  add column author_id uuid,
  add column moderation_status text not null default 'approved';
alter table public.community_posts
  add column moderation_status text not null default 'approved';
alter table public.post_comments
  add column moderation_status text not null default 'approved';

-- Replace open public-read policies to hide non-approved content
drop policy if exists "articles public read" on public.articles;
create policy "articles read approved or own" on public.articles for select using (
  moderation_status = 'approved' or auth.uid() = author_id or public.has_role(auth.uid(), 'admin')
);
create policy "articles expert insert" on public.articles for insert with check (
  auth.uid() = author_id and (public.has_role(auth.uid(), 'expert') or public.has_role(auth.uid(), 'admin'))
);
create policy "articles author update" on public.articles for update using (auth.uid() = author_id);
create policy "articles admin write" on public.articles for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "reels public read" on public.reels;
create policy "reels read approved or own" on public.reels for select using (
  moderation_status = 'approved' or auth.uid() = author_id or public.has_role(auth.uid(), 'admin')
);
create policy "reels expert insert" on public.reels for insert with check (
  auth.uid() = author_id and (public.has_role(auth.uid(), 'expert') or public.has_role(auth.uid(), 'admin'))
);
create policy "reels author update" on public.reels for update using (auth.uid() = author_id);
create policy "reels admin write" on public.reels for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "posts public read" on public.community_posts;
create policy "posts read approved or own" on public.community_posts for select using (
  moderation_status = 'approved' or auth.uid() = user_id or public.has_role(auth.uid(), 'admin')
);
create policy "posts admin write all" on public.community_posts for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "comments public read" on public.post_comments;
create policy "comments read approved or own" on public.post_comments for select using (
  moderation_status = 'approved' or auth.uid() = user_id or public.has_role(auth.uid(), 'admin')
);
create policy "comments admin write all" on public.post_comments for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create index on public.expert_applications (status, created_at desc);
create index on public.articles (moderation_status);
create index on public.reels (moderation_status);
