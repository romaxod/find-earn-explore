-- Fix the SELECT policy on conversations to allow viewing newly created conversations
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;

-- Allow users to see conversations they just created (within 10 seconds) or are participants in
CREATE POLICY "Users can view their conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  public.user_is_conversation_participant(id, auth.uid()) 
  OR created_at > (now() - interval '10 seconds')
);