-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a new policy that allows everyone to view all profiles
-- This is needed so users can view each other's profiles
CREATE POLICY "Anyone can view profiles"
ON public.profiles
FOR SELECT
USING (true);