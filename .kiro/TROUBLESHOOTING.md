# Troubleshooting "Unknown Error" When Starting Chat

## Quick Diagnosis Steps

### Step 1: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to start a chat
4. Look for error messages

**What to look for:**
- Red error messages
- Failed API calls to `/api/conversations`
- Network errors

### Step 2: Check Next.js Server Logs

In your `apps/web` terminal, you should see detailed logs like:

```
Creating conversation with participant: <user-id>
Current user: <your-user-id>
Existing conversation check: ...
Creating new conversation...
Created conversation: <conversation-id>
Successfully created conversation with participants
```

**If you see an error, it will show:**
- Which step failed
- The exact error message
- Database error details

### Step 3: Common Issues & Fixes

#### Issue 1: "Unauthorized" Error
**Symptom:** Error says "Unauthorized" or 401
**Cause:** Not logged in or session expired
**Fix:**
```bash
# Logout and login again
# Or check if auth token is valid in browser DevTools > Application > Cookies
```

#### Issue 2: "Failed to check existing conversations"
**Symptom:** Error when checking for existing DMs
**Cause:** Database query failed
**Fix:**
1. Check Supabase dashboard is accessible
2. Verify `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`
3. Check if `conversation_members` table exists

#### Issue 3: "Failed to create conversation"
**Symptom:** Error when creating new conversation
**Cause:** RLS policy blocking insert
**Fix:**
```sql
-- Run in Supabase SQL Editor:
-- Check if policy exists
SELECT * FROM pg_policies WHERE tablename = 'conversations';

-- If missing, create it:
CREATE POLICY "Users can create their own conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

#### Issue 4: "Failed to add participants"
**Symptom:** Conversation created but participants not added
**Cause:** RLS policy blocking insert into conversation_members
**Fix:**
```sql
-- Run in Supabase SQL Editor:
CREATE POLICY "Service role can manage conversation members"
  ON conversation_members FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### Step 4: Verify Environment Variables

Check `apps/web/.env.local`:

```bash
# Should have these variables:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # IMPORTANT!
```

**To get service role key:**
1. Go to Supabase Dashboard
2. Settings > API
3. Copy "service_role" key (NOT anon key)
4. Paste into `.env.local`
5. Restart Next.js server

### Step 5: Test Database Connection

Create a test file `apps/web/app/api/test-db/route.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test query
    const { data, error } = await adminSupabase
      .from('profiles')
      .select('id, username')
      .limit(1);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'Database connection works!',
      sample: data 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
```

Then visit: `http://localhost:3000/api/test-db`

### Step 6: Check Database Tables

In Supabase SQL Editor, run:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'conversation_members', 'profiles');

-- Check if you have data
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM conversations;
SELECT COUNT(*) FROM conversation_members;
```

### Step 7: Enable Realtime (for status updates)

In Supabase Dashboard:
1. Go to Database > Replication
2. Enable replication for `profiles` table
3. This allows real-time status updates

## Still Not Working?

### Get Detailed Error Info

Add this to your browser console:

```javascript
// Monitor all fetch requests
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log('Fetch:', args[0]);
  const response = await originalFetch(...args);
  const clone = response.clone();
  const data = await clone.json().catch(() => null);
  console.log('Response:', data);
  return response;
};
```

Then try starting a chat again and check console.

### Manual Test

Try creating a conversation manually:

```javascript
// In browser console:
const response = await fetch('/api/conversations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    participantId: 'paste-user-id-here' // Get from Supabase profiles table
  })
});
const data = await response.json();
console.log(data);
```

## Contact Support

If none of these work, provide:
1. Browser console screenshot
2. Next.js server logs
3. Supabase project URL (without keys!)
4. Error message from `/api/conversations`
