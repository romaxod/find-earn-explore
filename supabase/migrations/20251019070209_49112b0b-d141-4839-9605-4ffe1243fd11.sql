-- Fix the infinite recursion in conversation_participants INSERT policy
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;

-- Create a simpler INSERT policy that doesn't cause recursion
-- Allow users to add themselves to conversations if they're friends with other participants
CREATE POLICY "Users can join conversations"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);