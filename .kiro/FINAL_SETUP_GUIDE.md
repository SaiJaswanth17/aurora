# 🚀 Aurora Chat - Final Setup Guide

## ⚠️ CRITICAL: Fix the Profile Creation Issue First!

### The Error You're Seeing:
```
Error: insert on table 'conversation_members' violates 
foreign key constraint 'conversation_members_user_id_fkey'
```

### The Fix (Takes 2 minutes):

**Step 1:** Open Supabase Dashboard → SQL Editor

**Step 2:** Copy and paste this entire SQL script:

```sql
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

**Step 3:** Click "Run"

**Step 4:** Verify it worked:
```sql
SELECT COUNT(*) FROM auth.users;
SELECT COUNT(*) FROM profiles;
```
Both counts should be the same!

---

## ✅ Complete Setup Checklist

### 1. Environment Variables

**File: `apps/web/.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # IMPORTANT!
NEXT_PUBLIC_WS_URL=ws://localhost:3002
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**File: `apps/server/.env`**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # IMPORTANT!
WS_PORT=3002
WS_HOST=localhost
JWT_SECRET=your-jwt-secret-min-32-chars
```

### 2. Database Migrations

Run these in order in Supabase SQL Editor:

1. ✅ `001_initial_schema.sql`
2. ✅ `002_rls_policies.sql` (or `002_public_server.sql`)
3. ✅ `003_storage_setup.sql`
4. ✅ `004_functions.sql`
5. ✅ `005_conversation_rpc.sql`
6. ⚠️ **`006_auto_create_profile.sql`** ← RUN THIS NOW!

### 3. Enable Supabase Realtime

1. Go to Supabase Dashboard
2. Database → Replication
3. Enable replication for `profiles` table
4. This allows real-time status updates

### 4. Install Dependencies

```bash
# Root directory
bun install

# Build shared package
cd packages/shared
bun run build
cd ../..
```

### 5. Start Servers

**Terminal 1 - WebSocket Server:**
```bash
cd apps/server
bun run dev
```

You should see:
```
🚀 WebSocket server running on ws://localhost:3002
```

**Terminal 2 - Web App:**
```bash
cd apps/web
bun run dev
```

You should see:
```
▲ Next.js 14.0.4
- Local: http://localhost:3000
```

---

## 🧪 Testing (5 minutes)

### Test 1: Registration & Login

**Browser 1 (Chrome):**
1. Go to `http://localhost:3000`
2. Click "Register"
3. Email: `alice@test.com`
4. Password: `password123`
5. Username: `alice`
6. Click "Sign Up"

**Browser 2 (Firefox):**
1. Go to `http://localhost:3000`
2. Click "Register"
3. Email: `bob@test.com`
4. Password: `password123`
5. Username: `bob`
6. Click "Sign Up"

### Test 2: Start a Chat

**In Browser 1 (Alice):**
1. Click the "+" button (Direct Messages section)
2. Type "bob" in search
3. Click on Bob's profile
4. Should navigate to chat!

### Test 3: Send Messages

**In Browser 1 (Alice):**
1. Type: "Hi Bob!"
2. Press Enter
3. Message should appear

**In Browser 2 (Bob):**
1. Message from Alice should appear instantly!
2. Type: "Hey Alice!"
3. Press Enter

**Back in Browser 1:**
- Bob's message should appear instantly!

### Test 4: File Upload

**In Browser 1:**
1. Click the "+" button in message input
2. Select an image
3. Image should upload and appear in chat

**In Browser 2:**
- Image should appear instantly!

### Test 5: Emoji

**In Browser 1:**
1. Click the emoji button (smiley face)
2. Select an emoji
3. Type some text
4. Send
5. Message with emoji should appear

### Test 6: Voice Message

**In Browser 1:**
1. Click the microphone button
2. Allow microphone access
3. Speak for a few seconds
4. Click "Stop & Send"
5. Voice message should appear

**In Browser 2:**
- Voice message should appear with play button!

### Test 7: Offline Messaging

**In Browser 2 (Bob):**
1. Close the browser completely

**In Browser 1 (Alice):**
1. Send a message: "Are you there?"
2. Check server logs: Should see "Broadcast to 0 connections"
3. This is normal! Message is saved.

**In Browser 2 (Bob):**
1. Open browser again
2. Login
3. Open chat with Alice
4. Should see the message sent while offline!

---

## 🎯 What Should Work Now

### ✅ Core Features
- User registration and login
- User search
- DM conversation creation
- Real-time text messaging
- Offline messaging (messages saved and delivered later)
- File uploads (images, videos, audio)
- Voice message recording
- Emoji picker
- Typing indicators
- User status (online/offline/away/idle)
- WebSocket auto-reconnection

### ✅ UI Components
- Message bubbles
- Message input with auto-resize
- User avatars
- Status indicators
- Loading states
- Error messages
- Conversation list
- User search modal

### ✅ Server Features
- WebSocket server
- Authentication
- Rate limiting (10 msg/10sec)
- Message validation
- Connection management
- Presence tracking
- Message broadcasting

---

## 🐛 Troubleshooting

### Issue: "Unknown error" when starting chat

**Check:**
1. Did you run migration 006?
2. Do both users have profiles?

**Verify:**
```sql
SELECT au.email, p.username 
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id;
```

All users should have a username. If NULL, run migration 006 again.

### Issue: Messages not appearing

**Check:**
1. Is WebSocket server running?
2. Check browser console for errors
3. Check server logs for "Broadcast to X connections"

**Fix:**
- Restart both servers
- Clear browser cache
- Check WebSocket URL in `.env.local`

### Issue: File upload fails

**Check:**
1. Is storage bucket created?
2. Check RLS policies on storage

**Fix:**
Run `003_storage_setup.sql` again

### Issue: Can't find users in search

**Check:**
1. Are profiles created?
2. Check username spelling

**Verify:**
```sql
SELECT * FROM profiles;
```

---

## 📊 Server Logs Explained

### Normal Logs:
```
🔌 Connection opened: abc-123
✅ User authenticated: user-id
💬 New message in conversation xyz. Broadcast to 2 connections.
```

### When Recipient is Offline:
```
📩 New DM in conversation xyz. Broadcast to 0 connections.
```
**This is NORMAL!** Message is saved and will be delivered when user comes online.

### Errors to Watch For:
```
❌ Database error: ...
❌ Authentication failed: ...
❌ Rate limit exceeded: ...
```

---

## 🎉 Success Criteria

You'll know everything is working when:

1. ✅ Two users can register
2. ✅ They can find each other in search
3. ✅ They can start a chat
4. ✅ Messages appear instantly
5. ✅ Files upload successfully
6. ✅ Voice messages work
7. ✅ Emojis work
8. ✅ Offline messages are delivered
9. ✅ Status indicators update
10. ✅ No errors in console or server logs

---

## 📚 Additional Documentation

- `FEATURE_STATUS.md` - Complete feature list
- `SETUP_FIX.md` - Detailed profile creation fix
- `OFFLINE_MESSAGING.md` - How offline messaging works
- `TROUBLESHOOTING.md` - Common issues and solutions
- `QUICK_START.md` - Quick setup guide
- `CHAT_IMPROVEMENTS.md` - Future enhancements

---

## 🚀 Next Steps

Once basic chat is working:

1. Test all features thoroughly
2. Add message edit/delete (backend ready)
3. Add read receipts
4. Add message pagination
5. Add notification system
6. Test server channels
7. Add group chats

---

## 💡 Pro Tips

1. **Keep servers running** - Don't restart unnecessarily
2. **Use two browsers** - Chrome + Firefox for testing
3. **Check logs** - Both browser console and server terminal
4. **Test offline** - Close browser, send messages, reopen
5. **Clear cache** - If things act weird, clear browser cache

---

## ✅ Final Checklist

Before asking for help, verify:

- [ ] Migration 006 is run
- [ ] All users have profiles
- [ ] Environment variables are set
- [ ] Both servers are running
- [ ] No errors in browser console
- [ ] No errors in server logs
- [ ] WebSocket connection is established
- [ ] You can register and login
- [ ] You can search for users
- [ ] You can start a chat

If all checked, **chat should work perfectly!**

---

**Need Help?** Check the error message, search in the documentation files, or provide:
1. Browser console screenshot
2. Server logs
3. Exact steps to reproduce
4. Error message text
