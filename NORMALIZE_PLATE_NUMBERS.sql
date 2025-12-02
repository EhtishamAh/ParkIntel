-- Normalize all plate numbers by removing spaces
-- This ensures consistent matching between reservations and check-ins

-- Update pre_bookings table
UPDATE public.pre_bookings
SET plate_number = REGEXP_REPLACE(plate_number, '\s+', '', 'g')
WHERE plate_number ~ '\s';

-- Update parking_spots table
UPDATE public.parking_spots
SET current_plate = REGEXP_REPLACE(current_plate, '\s+', '', 'g')
WHERE current_plate IS NOT NULL AND current_plate ~ '\s';

-- Update parking_sessions table  
UPDATE public.parking_sessions
SET plate_number = REGEXP_REPLACE(plate_number, '\s+', '', 'g')
WHERE plate_number ~ '\s';

-- Verify the changes
SELECT 'pre_bookings' as table_name, plate_number FROM public.pre_bookings
UNION ALL
SELECT 'parking_spots' as table_name, current_plate FROM public.parking_spots WHERE current_plate IS NOT NULL
UNION ALL  
SELECT 'parking_sessions' as table_name, plate_number FROM public.parking_sessions;
