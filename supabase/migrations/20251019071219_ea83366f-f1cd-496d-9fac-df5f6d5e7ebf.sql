-- Fix infinite recursion by replacing all SELECT policies

-- 1. Drop ALL existing SELECT policies on conversation_participants
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view conversations they're part of" ON public.conversation_participants;

-- 2. Create security definer function (idempotent)
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

-- 3. Create single, clean SELECT policy
CREATE POLICY "view_conversation_participants"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
  public.is_user_in_conversation(conversation_id, auth.uid())
);