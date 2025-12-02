-- Clean up expired pre-bookings that are still marked as active
-- This prevents old reservations from showing as "reserved" in the operator dashboard

UPDATE public.pre_bookings
SET status = 'expired'
WHERE status = 'active' 
  AND expires_at < NOW();

-- Verify the cleanup
SELECT 
  id,
  plate_number,
  status,
  expires_at,
  CASE 
    WHEN expires_at < NOW() THEN 'EXPIRED'
    ELSE 'VALID'
  END as validity_status
FROM public.pre_bookings
ORDER BY created_at DESC;
