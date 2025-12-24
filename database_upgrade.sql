-- AI Agentixz USA - Database Schema Upgrade
-- Run this in your Supabase SQL Editor to add World-Class features

-- Add new columns for advanced task management
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS recurrence text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS total_time_spent integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS timer_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_completed_at timestamp with time zone;

-- Add check constraint for priority
ALTER TABLE tasks 
ADD CONSTRAINT tasks_priority_check 
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Add check constraint for recurrence
ALTER TABLE tasks 
ADD CONSTRAINT tasks_recurrence_check 
CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly'));

-- Create index for faster queries on priority and recurrence
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence ON tasks(recurrence);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
