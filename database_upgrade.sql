-- Upgrade script for world-class todo features

-- 1. Add priority and recurrence columns
alter table tasks 
add column if not exists priority text check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
add column if not exists recurrence text check (recurrence in ('none', 'daily', 'weekly', 'monthly')) default 'none',
add column if not exists last_completed_at timestamp with time zone,
add column if not exists tags text[];

-- 2. Update existing policies if necessary (usually not needed if just adding columns)
-- 3. You can run this in your Supabase SQL Editor.
