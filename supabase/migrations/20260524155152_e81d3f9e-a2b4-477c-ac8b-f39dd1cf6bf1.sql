
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  parent_name text,
  concerns text[],
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- Babies
create table public.babies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  birth_date date,
  pregnancy_due_date date,
  is_pregnancy boolean not null default false,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.babies enable row level security;
create policy "own babies all" on public.babies for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Milestones
create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  baby_id uuid not null references public.babies(id) on delete cascade,
  category text not null,
  title text not null,
  notes text,
  value_numeric numeric,
  unit text,
  achieved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.milestones enable row level security;
create policy "own milestones all" on public.milestones for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- AI Conversations
create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ai_conversations enable row level security;
create policy "own convos all" on public.ai_conversations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.ai_messages enable row level security;
create policy "own msgs all" on public.ai_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Articles (public read)
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  excerpt text,
  category text not null,
  body text not null,
  cover_image_url text,
  read_minutes int default 4,
  created_at timestamptz not null default now()
);
alter table public.articles enable row level security;
create policy "articles public read" on public.articles for select using (true);

-- Is this normal topics (public read)
create table public.is_this_normal_topics (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text not null,
  symptoms text[],
  safe_tips text[],
  warning_signs text[],
  when_to_see_doctor text,
  created_at timestamptz not null default now()
);
alter table public.is_this_normal_topics enable row level security;
create policy "topics public read" on public.is_this_normal_topics for select using (true);

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  read boolean not null default false,
  scheduled_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "own notifications all" on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, parent_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'parent_name', new.raw_user_meta_data->>'full_name', null))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- updated_at triggers
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger babies_touch before update on public.babies for each row execute function public.touch_updated_at();
create trigger ai_conversations_touch before update on public.ai_conversations for each row execute function public.touch_updated_at();
