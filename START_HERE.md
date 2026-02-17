# 🚀 START HERE - Complete Setup Guide

## Quick Start (3 Commands)

```bash
# Terminal 1: Start WebSocket Server
cd apps/server && bun run dev

# Terminal 2: Start Web App  
cd apps/web && bun run dev

# Terminal 3: Check if everything is running
curl http://localhost:3001 && curl http://localhost:3000
```

## Current System Status

✅ **Database**: Healthy
- 4 users with profiles
- 3 conversations
- 0 messages (fresh start)
- All duplicates removed
- All encrypted messages removed

✅ **Build**: Passing
✅ **Code**: Fixed and ready

## Testing Messaging (Step by Step)

### Step 1: Start Servers

**Terminal 1 - WebSocket Server:**
```bash
cd apps/server
bun run dev
```

**Wait for this message:**
```
✅ WebSocket Server running on port 3001
📡 WebSocket URL: ws://localhost:3001
```

**Terminal 2 - Web App:**
```bash
cd apps/web
bun run dev
```

**Wait for:**
```
✓ Ready in 2s
○ Local: http://localhost:3000
```

### Step 2: Open Two DIFFERENT Browsers

**Why different browsers?**
- Same browser = same session (even in different tabs)
- Different browsers = different sessions
- This is how ALL web apps work (Gmail, Facebook, etc.)

**Browser 1 (Chrome):**
1. Go to `http://localhost:3000`
2. Log in as: `saijaswanth1728@gmail.com`
3. Password: (your password)
4. Click on "Sai" in the DM list

**Browser 2 (Firefox OR Chrome Incognito):**
1. Go to `http://localhost:3000`
2. Log in as: `saidj7654@gmail.com`
3. Password: (your password)
4. You should see "saijaswanth1728" in the DM list
5. Click on it

### Step 3: Send Messages

**In Browser 1 (saijaswanth1728):**
1. Type: "Hello from saijaswanth1728"
2. Press Enter or click Send
3. Message should appear immediately

**In Browser 2 (Sai):**
1. You should see "Hello from saijaswanth1728" appear WITHOUT refreshing
2. Type: "Hi from Sai"
3. Press Enter

**In Browser 1:**
- "Hi from Sai" should appear immediately

## Verification Checklist

### Before Testing:
- [ ] WebSocket server running (Terminal 1 shows "WebSocket Server running")
- [ ] Web app running (Terminal 2 shows "Ready")
- [ ] Using TWO DIFFERENT browsers (Chrome + Firefox) OR (Chrome + Chrome Incognito)

### During Testing:
- [ ] Open browser console (F12) in both browsers
- [ ] Check for "WebSocket connected to server" message
- [ ] Check for "WebSocket authentication successful" message

### Expected Behavior:
- [ ] User A sends message → appears immediately for User A
- [ ] User B sees message → WITHOUT refreshing page
- [ ] User B replies → User A sees it immediately
- [ ] Messages persist after page refresh

## Troubleshooting

### Problem: "WebSocket connection failed"

**Solution:**
```bash
# Make sure WebSocket server is running
cd apps/server
bun run dev
```

### Problem: Same user in both browsers

**You're using the same browser!**

**Solution:**
- Browser 1: Chrome (normal)
- Browser 2: Firefox OR Chrome Incognito (Ctrl+Shift+N)

### Problem: Messages don't appear in real-time

**Checklist:**
1. WebSocket server running? → Check Terminal 1
2. Browser console shows "WebSocket connected"? → Press F12
3. Using different browsers? → Not same browser in different tabs
4. Both users in same conversation? → Click on the same person

### Problem: "No messages yet" after sending

**Check browser console (F12):**
- Look for red error messages
- Check Network tab for failed API calls
- Look for "Failed to send message" errors

**Common causes:**
- WebSocket not connected
- Not a member of the conversation
- API error

## Available Users

```
1. saijaswanth1728@gmail.com (saijaswanth1728)
2. saidj7654@gmail.com (Sai)
3. coriuday.18@gmail.com (coriuday)
4. ankithrajgodugu@gmail.com (Ankith_raj_godugu)
```

## Test Scenarios

### Scenario 1: Basic Messaging
1. User A logs in
2. User B logs in (different browser)
3. User A sends "Hello"
4. User B sees "Hello" immediately
5. User B replies "Hi"
6. User A sees "Hi" immediately

### Scenario 2: Multiple Messages
1. User A sends 5 messages quickly
2. User B should see all 5 messages appear
3. User B replies
4. User A should see the reply

### Scenario 3: Persistence
1. User A sends message
2. User B sees it
3. User B refreshes page (F5)
4. Message should still be there

## Production Deployment

### 1. Deploy WebSocket Server

**Railway:**
```bash
railway init
railway up
```

**Render/Heroku:**
- Connect your Git repository
- Set build command: `cd apps/server && bun install && bun run build`
- Set start command: `cd apps/server && bun run start`

### 2. Deploy Frontend (Vercel)

```bash
git push
```

**Environment Variables in Vercel:**
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_WS_URL=wss://your-websocket-server.com/ws
```

### 3. Apply Database Migration

Go to Supabase Dashboard → SQL Editor:

```sql
CREATE OR REPLACE FUNCTION get_or_create_dm_conversation(participant_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  existing_conversation_id UUID;
  new_conversation_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF current_user_id = participant_id THEN
    RAISE EXCEPTION 'Cannot create conversation with yourself';
  END IF;

  SELECT c.id INTO existing_conversation_id
  FROM conversations c
  WHERE c.type = 'dm'
    AND c.id IN (
      SELECT cm1.conversation_id FROM conversation_members cm1 WHERE cm1.user_id = current_user_id
      INTERSECT
      SELECT cm2.conversation_id FROM conversation_members cm2 WHERE cm2.user_id = participant_id
    )
    AND (SELECT COUNT(*) FROM conversation_members cm WHERE cm.conversation_id = c.id) = 2
  LIMIT 1;

  IF existing_conversation_id IS NOT NULL THEN
    RETURN existing_conversation_id;
  END IF;

  INSERT INTO conversations (type) VALUES ('dm') RETURNING id INTO new_conversation_id;
  INSERT INTO conversation_members (conversation_id, user_id)
  VALUES (new_conversation_id, current_user_id), (new_conversation_id, participant_id);

  RETURN new_conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_or_create_dm_conversation(UUID) TO authenticated;
```

## Summary

✅ All issues fixed
✅ Database clean
✅ Build passing
✅ Ready to test

**Just follow the 3 steps above and messaging will work!**

1. Start WebSocket server
2. Start web app
3. Use two different browsers

---

**Need help? Check browser console (F12) for error messages!**
