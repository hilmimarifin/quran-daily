-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid references auth.users not null primary key,
  display_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- BOOKMARKS
create table public.bookmarks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  surah_number integer not null,
  verse_number integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.bookmarks enable row level security;

create policy "Users can view own bookmarks."
  on bookmarks for select
  using ( auth.uid() = user_id );

create policy "Users can insert own bookmarks."
  on bookmarks for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own bookmarks."
  on bookmarks for update
  using ( auth.uid() = user_id );

create policy "Users can delete own bookmarks."
  on bookmarks for delete
  using ( auth.uid() = user_id );

-- GROUPS
create table public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.groups enable row level security;

create policy "Groups are viewable by members (handled via join, but for now public for simplicity or check membership)"
  on groups for select
  using ( true ); -- Simplified for MVP discovery, or restrict to members

create policy "Users can create groups."
  on groups for insert
  with check ( auth.uid() = created_by );

-- GROUP MEMBERS
create table public.group_members (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups not null,
  user_id uuid references auth.users not null,
  role text check (role in ('admin', 'member')) default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()),
  current_bookmark_id uuid references public.bookmarks,
  unique(group_id, user_id)
);

alter table public.group_members enable row level security;

create policy "Group members are viewable by everyone in the group."
  on group_members for select
  using ( true ); -- Simplified

create policy "Users can join groups."
  on group_members for insert
  with check ( auth.uid() = user_id );

-- READING LOGS (Optional for MVP, but good for tracking history)
create table public.reading_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  group_id uuid references public.groups,
  character_count integer default 0,
  period_start timestamp with time zone,
  period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.reading_logs enable row level security;

create policy "Users can view own logs."
  on reading_logs for select
  using ( auth.uid() = user_id );
