-- Update conversation_participants INSERT policy to allow adding friends to conversations
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;

CREATE POLICY "Users can join conversations"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  -- Users can add themselves to any conversation
  auth.uid() = user_id
  OR
  -- Users can add their friends to conversations
  EXISTS (
    SELECT 1
    FROM friend_requests
    WHERE friend_requests.status = 'accepted'
    AND (
      (friend_requests.sender_id = auth.uid() AND friend_requests.receiver_id = user_id)
      OR
      (friend_requests.receiver_id = auth.uid() AND friend_requests.sender_id = user_id)
    )
  )
);