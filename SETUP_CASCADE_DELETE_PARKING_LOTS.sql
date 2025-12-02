-- Setup CASCADE DELETE for ParkingLots table
-- This ensures that when a parking lot is deleted, all related data is automatically removed
-- Including: parking_spots, pre_bookings, parking_sessions, and operators assignments

-- =============================================================================
-- STEP 1: Drop existing foreign key constraints
-- =============================================================================

-- Drop foreign key from parking_spots
ALTER TABLE public.parking_spots 
DROP CONSTRAINT IF EXISTS parking_spots_lot_id_fkey;

-- Drop foreign key from pre_bookings
ALTER TABLE public.pre_bookings 
DROP CONSTRAINT IF EXISTS pre_bookings_lot_id_fkey;

-- Drop foreign key from parking_sessions
ALTER TABLE public.parking_sessions 
DROP CONSTRAINT IF EXISTS parking_sessions_lot_id_fkey;

-- =============================================================================
-- STEP 2: Re-create foreign keys WITH CASCADE DELETE
-- =============================================================================

-- parking_spots: CASCADE DELETE when parking lot is deleted
ALTER TABLE public.parking_spots
ADD CONSTRAINT parking_spots_lot_id_fkey 
FOREIGN KEY (lot_id) 
REFERENCES public."ParkingLots"(id) 
ON DELETE CASCADE;

-- pre_bookings: CASCADE DELETE when parking lot is deleted
ALTER TABLE public.pre_bookings
ADD CONSTRAINT pre_bookings_lot_id_fkey 
FOREIGN KEY (lot_id) 
REFERENCES public."ParkingLots"(id) 
ON DELETE CASCADE;

-- parking_sessions: CASCADE DELETE when parking lot is deleted
ALTER TABLE public.parking_sessions
ADD CONSTRAINT parking_sessions_lot_id_fkey 
FOREIGN KEY (lot_id) 
REFERENCES public."ParkingLots"(id) 
ON DELETE CASCADE;

-- =============================================================================
-- STEP 3: Create function to handle operator lot assignments
-- =============================================================================

-- This function removes the deleted lot_id from operators' assigned_lots array
CREATE OR REPLACE FUNCTION public.remove_lot_from_operators()
RETURNS TRIGGER AS $$
BEGIN
  -- Remove the deleted lot_id from all operators' assigned_lots arrays
  UPDATE public.operators
  SET assigned_lots = array_remove(assigned_lots, OLD.id)
  WHERE OLD.id = ANY(assigned_lots);
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 4: Create trigger to clean up operator assignments
-- =============================================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS cleanup_operator_lots_on_delete ON public."ParkingLots";

-- Create trigger that fires BEFORE parking lot deletion
CREATE TRIGGER cleanup_operator_lots_on_delete
BEFORE DELETE ON public."ParkingLots"
FOR EACH ROW
EXECUTE FUNCTION public.remove_lot_from_operators();

-- =============================================================================
-- STEP 5: Verify the setup
-- =============================================================================

-- Check all foreign key constraints related to ParkingLots
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    confdeltype AS on_delete_action,
    CASE confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
    END AS on_delete_action_name
FROM pg_constraint
WHERE confrelid = 'public."ParkingLots"'::regclass
ORDER BY conname;

-- Verify the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'ParkingLots'
ORDER BY trigger_name;

-- =============================================================================
-- TESTING (DO NOT RUN IN PRODUCTION WITHOUT BACKUP)
-- =============================================================================

-- To test the cascade delete (ONLY in development):
/*
-- 1. Check what would be deleted for a specific lot
SELECT 'parking_spots' as table_name, COUNT(*) as count 
FROM public.parking_spots WHERE lot_id = YOUR_LOT_ID
UNION ALL
SELECT 'pre_bookings', COUNT(*) 
FROM public.pre_bookings WHERE lot_id = YOUR_LOT_ID
UNION ALL
SELECT 'parking_sessions', COUNT(*) 
FROM public.parking_sessions WHERE lot_id = YOUR_LOT_ID
UNION ALL
SELECT 'operators with assignment', COUNT(*) 
FROM public.operators WHERE YOUR_LOT_ID = ANY(assigned_lots);

-- 2. Then delete the lot (this will cascade to all related tables)
DELETE FROM public."ParkingLots" WHERE id = YOUR_LOT_ID;

-- 3. Verify everything was cleaned up
SELECT 'parking_spots' as table_name, COUNT(*) as remaining 
FROM public.parking_spots WHERE lot_id = YOUR_LOT_ID
UNION ALL
SELECT 'pre_bookings', COUNT(*) 
FROM public.pre_bookings WHERE lot_id = YOUR_LOT_ID
UNION ALL
SELECT 'parking_sessions', COUNT(*) 
FROM public.parking_sessions WHERE lot_id = YOUR_LOT_ID;
*/

COMMIT;

-- =============================================================================
-- Summary of Changes:
-- =============================================================================
-- ✅ parking_spots: Will be automatically deleted when parking lot is deleted
-- ✅ pre_bookings: Will be automatically deleted when parking lot is deleted  
-- ✅ parking_sessions: Will be automatically deleted when parking lot is deleted
-- ✅ operators.assigned_lots: Lot ID will be removed from array via trigger
-- 
-- When you delete a parking lot, ALL related data is automatically cleaned up!
-- =============================================================================
