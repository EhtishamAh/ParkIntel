# Testing Instructions for Authentication Fix

## Before Testing:

1. **Clear Browser Data:**
   - Open DevTools (F12)
   - Go to Application tab → Storage
   - Click "Clear site data"
   - OR manually clear:
     - Cookies (especially those starting with `sb-`)
     - Local Storage
     - Session Storage

2. **Close all browser tabs** for your app

3. **Restart the dev server:**
   ```bash
   npm run dev
   ```

## Test Scenarios:

### Test 1: Signup as Driver
1. Go to `/signup`
2. Click "Sign Up with Google" under Driver
3. Complete Google OAuth
4. **Check Console** - you should see:
   ```
   🔄 Starting complete signup process...
   ✅ Session found: [user-id]
   📋 Pending role from localStorage: driver
   🔄 Updating profile role to: driver
   ✅ Profile role updated successfully
   🎉 Signup complete, redirecting to dashboard
   ```
5. Should redirect to `/map` (driver view)

### Test 2: Signup as Owner
1. Clear browser data again
2. Go to `/signup`
3. Click "Register Business with Google" under Owner
4. Complete Google OAuth
5. **Check Console** - should see role: owner
6. Should redirect to `/owner/dashboard`

### Test 3: Login (Existing User)
1. After signing up, sign out (if your app has logout)
2. Go to `/login`
3. Click "Sign in with Google"
4. **Check Console** - should see:
   ```
   👤 Existing user logging in...
   ➡️  Redirecting to dashboard
   ```
5. Should redirect directly to dashboard (no complete-signup step)
6. Dashboard should route you based on your existing role

## Common Issues & Solutions:

### "both auth code and code verifier should be non-empty"
- **Cause:** OAuth callback being processed twice
- **Solution:** Clear browser data completely and try again

### "No session found"
- **Cause:** Cookies not being set properly
- **Solution:** Check that your Supabase URL is configured correctly in `.env.local`

### Profile not created
- **Cause:** Database table doesn't exist
- **Solution:** Run the SQL commands to create the `profiles` table

## What to Check in Console:

✅ **Good signs:**
- All emojis showing (🔄 ✅ 📋 🎉)
- "Profile role updated successfully"
- No error messages

❌ **Bad signs:**
- ❌ emoji appearing
- "Error getting session"
- "No session found"
- Any red error messages

## Database Verification:

After successful signup, check Supabase:
1. Go to Table Editor
2. Open `profiles` table
3. Verify:
   - Row exists with your user ID
   - `role` field matches what you selected (driver/owner)
   - `email` and `full_name` are populated
