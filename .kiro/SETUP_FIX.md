# Critical Setup Fix - Profile Creation Issue

## The Problem

You're seeing this error:
```
Error: insert on table 'conversation_members' violates 
foreign key constraint 'conversation_members_user_id_fkey'
```

**Root Cause:** Users in the search results don't have profiles in the `profiles` table, so when trying to create a conversation, the foreign key constraint fails.

## The Solution

### Step 1: Run the New Migration

In your Supabase SQL Editor, run this migration:

```sql
-- File: supabase/migrations/006_auto_create_profile.sql

-- Function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, status, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    'online',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: Create profiles for any existing users that don't have one
INSERT INTO public.profiles (id, username, status, created_at)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'username', SPLIT_PART(au.email, '@', 1)),
  'offline',
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

### Step 2: Verify Profiles Exist

Run this query to check:

```sql
-- Check if all users have profiles
SELECT 
  au.id,
  au.email,
  p.username,
  CASE WHEN p.id IS NULL THEN 'MISSING PROFILE' ELSE 'OK' END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id;
```

All users should show "OK". If any show "MISSING PROFILE", the backfill didn't work.

### Step 3: Test Chat Creation

1. Logout and login again (to ensure your profile exists)
2. Search for another user
3. Click "Start chat"
4. Should work now!

## What Was Fixed

### 1. Added Profile Auto-Creation Trigger ✅
- Automatically creates a profile when a user signs up
- Uses username from signup metadata or email prefix
- Sets initial status to 'online'

### 2. Backfilled Missing Profiles ✅
- Creates profiles for any existing users without one
- Uses email prefix as username if no metadata exists

### 3. Added Profile Validation in API ✅
- Checks if both users exist before creating conversation
- Returns clear error messages if profiles are missing

## Alternative: Manual Profile Creation

If the trigger doesn't work, you can manually create profiles:

```sql
-- For a specific user
INSERT INTO public.profiles (id, username, status, created_at)
VALUES (
  'user-id-here',
  'username-here',
  'online',
  NOW()
);
```

## Testing Checklist

- [ ] Run migration 006
- [ ] Verify all users have profiles
- [ ] Logout and login
- [ ] Search for a user
- [ ] Start a chat
- [ ] Send a message
- [ ] Receive a message

## Still Having Issues?

### Check 1: Verify Trigger Exists

```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

Should return 1 row.

### Check 2: Test Trigger Manually

```sql
-- This should automatically create a profile
-- (Don't actually run this, just for testing)
-- INSERT INTO auth.users (email, ...) VALUES (...);
```

### Check 3: Check RLS Policies

```sql
-- Profiles table should allow inserts
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

## Next Steps

Once profiles are working:
1. ✅ Chat creation will work
2. ✅ Message sending will work
3. ✅ File uploads will work
4. ✅ All UI features will work

The entire chat functionality depends on profiles existing!
