-- Fix function search path security issue
DROP FUNCTION IF EXISTS update_conversation_read_status(uuid, uuid);

CREATE OR REPLACE FUNCTION update_conversation_read_status(conv_id uuid, user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE conversation_participants
  SET last_read_at = now()
  WHERE conversation_id = conv_id AND conversation_participants.user_id = user_id;
END;
$$;