-- Fix the infinite recursion in conversation_participants properly

-- 1. Create a security definer function to check if user is in conversation
CREATE OR REPLACE FUNCTION public.is_user_in_conversation(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = _conversation_id
      AND user_id = _user_id
  )
$$;

-- 2. Drop the problematic SELECT policy
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;

-- 3. Create new SELECT policy using the security definer function
CREATE POLICY "Users can view participants in their conversations"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
  public.is_user_in_conversation(conversation_id, auth.uid())
);