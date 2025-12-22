-- Run this in your Supabase SQL Editor (https://app.supabase.com/project/_/sql)

-- 1. Create the tasks table
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamp with time zone,
  status text check (status in ('pending', 'completed')) default 'pending',
  created_at timestamp with time zone default now()
);

-- 2. Enable Row Level Security (RLS)
alter table tasks enable row level security;

-- 3. Create RLS Policies
create policy "Users can view their own tasks"
  on tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on tasks for delete
  using (auth.uid() = user_id);
