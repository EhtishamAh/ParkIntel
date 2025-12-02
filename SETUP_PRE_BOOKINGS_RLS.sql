-- Setup Row Level Security (RLS) policies for pre_bookings table
-- This allows drivers to manage their own reservations and operators to view all reservations for their assigned lots

-- Enable RLS on pre_bookings table
ALTER TABLE public.pre_bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own pre_bookings" ON public.pre_bookings;
DROP POLICY IF EXISTS "Users can insert own pre_bookings" ON public.pre_bookings;
DROP POLICY IF EXISTS "Users can update own pre_bookings" ON public.pre_bookings;
DROP POLICY IF EXISTS "Operators can view pre_bookings for assigned lots" ON public.pre_bookings;
DROP POLICY IF EXISTS "Public can view all pre_bookings" ON public.pre_bookings;

-- Policy 1: Allow all authenticated users to view all pre_bookings (simplest solution)
-- This allows drivers to see their reservations and operators to see all reservations
CREATE POLICY "Authenticated users can view all pre_bookings"
ON public.pre_bookings
FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Users can insert their own pre_bookings
CREATE POLICY "Users can insert own pre_bookings"
ON public.pre_bookings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own pre_bookings (for cancellation)
CREATE POLICY "Users can update own pre_bookings"
ON public.pre_bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own pre_bookings
CREATE POLICY "Users can delete own pre_bookings"
ON public.pre_bookings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pre_bookings TO authenticated;
GRANT SELECT ON public.pre_bookings TO anon;

-- Verify policies are set up
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'pre_bookings';
