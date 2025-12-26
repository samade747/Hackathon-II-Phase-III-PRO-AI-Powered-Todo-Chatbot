-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to insert tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Allow users to read own tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Allow users to update own tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Allow users to delete own tasks" ON "public"."tasks";
-- Also drop potentially existing policies from previous inits
DROP POLICY IF EXISTS "Users can view their own tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Users can insert their own tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Users can update their own tasks" ON "public"."tasks";
DROP POLICY IF EXISTS "Users can delete their own tasks" ON "public"."tasks";

-- Enable RLS (idempotent)
ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert tasks
-- Removed ::text cast from auth.uid() because user_id is type uuid
CREATE POLICY "Allow authenticated users to insert tasks"
ON "public"."tasks"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to select their own tasks
CREATE POLICY "Allow users to read own tasks"
ON "public"."tasks"
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to update their own tasks  
CREATE POLICY "Allow users to update own tasks"
ON "public"."tasks"
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to delete their own tasks
CREATE POLICY "Allow users to delete own tasks"
ON "public"."tasks"
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
