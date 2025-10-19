-- Fix infinite recursion and conversation creation issues

-- 1. Drop problematic SELECT policies
DROP POLICY IF EXISTS "Users can view conversations they're part of" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;

-- 2. Create simple SELECT policy without recursion
CREATE POLICY "Users can view conversation participants"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
  -- User can see participants in conversations where they are also a participant
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- 3. Fix INSERT policy to allow adding friends to conversations
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;

CREATE POLICY "Users can add participants to conversations"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  -- Users can add themselves
  auth.uid() = user_id
  OR
  -- Users can add friends (must be mutual friends)
  EXISTS (
    SELECT 1 FROM friend_requests
    WHERE status = 'accepted'
    AND (
      (sender_id = auth.uid() AND receiver_id = user_id)
      OR
      (receiver_id = auth.uid() AND sender_id = user_id)
    )
  )
);