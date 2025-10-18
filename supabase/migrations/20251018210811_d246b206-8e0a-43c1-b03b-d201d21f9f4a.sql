-- Reset all generated images back to placeholder
UPDATE events 
SET image_url = '/placeholder.svg'
WHERE image_url LIKE '@/assets/%';