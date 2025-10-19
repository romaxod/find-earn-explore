-- Drop the insecure public read policy
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Create policy for users to view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create policy for users to view profiles of accepted friends
CREATE POLICY "Users can view accepted friends' profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.friend_requests
    WHERE status = 'accepted'
    AND (
      (sender_id = auth.uid() AND receiver_id = profiles.id)
      OR
      (receiver_id = auth.uid() AND sender_id = profiles.id)
    )
  )
);