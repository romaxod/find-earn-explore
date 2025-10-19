-- Update conversations SELECT policy to allow viewing newly created conversations
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;

CREATE POLICY "Users can view their conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  -- Either the user is a participant
  EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
    AND conversation_participants.user_id = auth.uid()
  )
  -- Or the conversation was just created (within last 5 seconds) to allow SELECT after INSERT
  OR conversations.created_at > (now() - interval '5 seconds')
);