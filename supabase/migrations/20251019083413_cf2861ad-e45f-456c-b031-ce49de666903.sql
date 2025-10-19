-- Add last_read_at column to conversation_participants to track when user last viewed the conversation
ALTER TABLE conversation_participants
ADD COLUMN last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create function to update last_read_at when user views a conversation
CREATE OR REPLACE FUNCTION update_conversation_read_status(conv_id uuid, user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE conversation_participants
  SET last_read_at = now()
  WHERE conversation_id = conv_id AND conversation_participants.user_id = user_id;
END;
$$;