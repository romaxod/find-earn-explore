-- Remove culture/arts events that are not Theater Plays, Film Shows, or Operas
DELETE FROM events WHERE id IN (
  'c7bad10c-0319-46de-848c-00cf14e7f425', -- Contemporary Georgian Art Exhibition
  '7a2238a9-0305-4c92-b105-c0723a57a6ad', -- Tech Startup Pitch Night
  '5040bc9e-184e-44c1-975c-39e5247e3b19'  -- Photography Exhibition: Caucasus
);