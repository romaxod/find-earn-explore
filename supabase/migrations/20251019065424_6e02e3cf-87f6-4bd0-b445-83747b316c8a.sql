-- Fix conversation_participants SELECT policy to allow viewing all participants
-- in conversations where the user is a participant
DROP POLICY IF EXISTS "Users can view conversations they're part of" ON conversation_participants;

CREATE POLICY "Users can view conversations they're part of"
ON conversation_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversation_participants AS cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  )
);