-- AI Agentixz USA - Complete Database Schema
-- Run this in your Supabase SQL Editor (https://app.supabase.com/project/_/sql)

-- 1. Create the tasks table with all World-Class features
CREATE TABLE IF NOT EXISTS tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  due_date timestamp with time zone,
  status text CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  recurrence text DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly')),
  tags jsonb DEFAULT '[]'::jsonb,
  total_time_spent integer DEFAULT 0,
  timer_started_at timestamp with time zone,
  last_completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence ON tasks(recurrence);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
