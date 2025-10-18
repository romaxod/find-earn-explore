-- Update coordinates for key venues to accurate locations

-- Vake Park (41.7089, 44.7514)
UPDATE events 
SET location_lat = 41.7089, location_lng = 44.7514
WHERE location_name = 'Vake Park';

-- Freedom Square (41.6938, 44.8015)
UPDATE events 
SET location_lat = 41.6938, location_lng = 44.8015
WHERE location_name = 'Freedom Square Start';

-- Bassiani Club at Dinamo Stadium (41.7230, 44.7898)
UPDATE events 
SET location_lat = 41.7230, location_lng = 44.7898
WHERE location_name = 'Bassiani Club';

-- Khidi Club under bridge (41.6945, 44.8067)
UPDATE events 
SET location_lat = 41.6945, location_lng = 44.8067
WHERE location_name LIKE '%Khidi%';

-- Tes Club on Dodo Abashidze (41.7045, 44.7880)
UPDATE events 
SET location_lat = 41.7045, location_lng = 44.7880
WHERE location_name = 'Tes Club';