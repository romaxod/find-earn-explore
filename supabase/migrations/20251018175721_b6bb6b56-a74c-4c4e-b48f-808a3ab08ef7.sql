-- Create event RSVPs table
CREATE TABLE public.event_rsvps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Enable RLS
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Users can view all RSVPs
CREATE POLICY "Anyone can view event RSVPs"
ON public.event_rsvps
FOR SELECT
USING (true);

-- Users can create their own RSVPs
CREATE POLICY "Users can create their own RSVPs"
ON public.event_rsvps
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own RSVPs
CREATE POLICY "Users can delete their own RSVPs"
ON public.event_rsvps
FOR DELETE
USING (auth.uid() = user_id);