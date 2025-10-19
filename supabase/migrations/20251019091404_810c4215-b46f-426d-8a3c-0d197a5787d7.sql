-- Fix the ambiguous user_id reference in update_conversation_read_status function
DROP FUNCTION IF EXISTS public.update_conversation_read_status(uuid, uuid);

CREATE OR REPLACE FUNCTION public.update_conversation_read_status(conv_id uuid, user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE conversation_participants
  SET last_read_at = now()
  WHERE conversation_id = conv_id 
    AND conversation_participants.user_id = update_conversation_read_status.user_id;
END;
$$;