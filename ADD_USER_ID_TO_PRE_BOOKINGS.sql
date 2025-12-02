-- Add reservation_fee column to pre_bookings table
-- This stores the 20% pre-booking fee charged to the user

ALTER TABLE public.pre_bookings 
ADD COLUMN IF NOT EXISTS reservation_fee numeric;

-- Add comment for documentation
COMMENT ON COLUMN public.pre_bookings.reservation_fee IS 'The 20% reservation fee charged for pre-booking (in PKR)';
