-- Enable realtime for messages table so users can receive messages instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;