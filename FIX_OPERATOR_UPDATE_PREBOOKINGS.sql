-- Fix RLS policies to allow operators to update pre-bookings
-- This allows operators to convert reservations to 'converted' status during check-in

-- Drop the restrictive update policy
DROP POLICY IF EXISTS "Users can update own pre_bookings" ON public.pre_bookings;

-- Policy: Users can update their own pre_bookings (for cancellation)
CREATE POLICY "Users can update own pre_bookings"
ON public.pre_bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Operators can update pre_bookings for any lot (to convert reservations during check-in)
-- This allows operators to change status from 'active' to 'converted'
CREATE POLICY "Operators can update pre_bookings"
ON public.pre_bookings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.operators 
    WHERE operators.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.operators 
    WHERE operators.owner_id = auth.uid()
  )
);

-- Verify policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'pre_bookings'
ORDER BY policyname;
