-- Create event_invitations table
CREATE TABLE public.event_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_id, sender_id, receiver_id)
);

-- Enable RLS on event_invitations
ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_invitations
CREATE POLICY "Users can view their event invitations"
ON public.event_invitations
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send event invitations to friends"
ON public.event_invitations
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.friend_requests
    WHERE status = 'accepted' AND
    ((sender_id = auth.uid() AND receiver_id = event_invitations.receiver_id) OR
     (receiver_id = auth.uid() AND sender_id = event_invitations.receiver_id))
  )
);

CREATE POLICY "Users can update received event invitations"
ON public.event_invitations
FOR UPDATE
USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their sent invitations"
ON public.event_invitations
FOR DELETE
USING (auth.uid() = sender_id);

-- Create trigger for updating event_invitations updated_at
CREATE TRIGGER update_event_invitations_updated_at
BEFORE UPDATE ON public.event_invitations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_event_invitations_sender ON public.event_invitations(sender_id);
CREATE INDEX idx_event_invitations_receiver ON public.event_invitations(receiver_id);
CREATE INDEX idx_event_invitations_event ON public.event_invitations(event_id);
CREATE INDEX idx_event_invitations_status ON public.event_invitations(status);