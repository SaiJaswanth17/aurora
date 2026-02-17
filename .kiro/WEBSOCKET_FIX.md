# WebSocket Real-Time Messaging Fix

## The Problem

Messages are being saved to the database but not delivered in real-time to the receiver. This happens because:

1. **WebSocket server not running** - Most common issue
2. **Receiver not joining conversation** - Frontend doesn't call joinConversation
3. **Broadcast not reaching receiver** - Server issue

## The Solution

### Step 1: Verify WebSocket Server is Running

```bash
cd apps/server
bun run dev
```

**You MUST see:**
```
✅ WebSocket Server running on port 3001
📡 WebSocket URL: ws://localhost:3001
```

**Test if it's running:**
```bash
curl http://localhost:3001
```

Should return: `Aurora WebSocket Server Running`

### Step 2: Check Browser Console

Open browser console (F12) for BOTH users and check for:

**Expected messages:**
```
✅ WebSocket connected to server
✅ WebSocket authentication successful
✅ Joined conversation: [conversation-id]
```

**If you see:**
```
❌ WebSocket connection failed
   → WebSocket server is NOT running!

❌ WebSocket authentication error
   → Token expired, log out and log in again

❌ No "Joined conversation" message
   → User didn't open the conversation
```

### Step 3: Ensure Both Users Open the Conversation

**This is CRITICAL:**

1. **User A** must click on User B in the DM list
2. **User B** must click on User A in the DM list
3. Both must have the conversation OPEN
4. Check browser console for "Joined conversation" message

### Step 4: Send Test Message

**User A:**
1. Type "Test message 1"
2. Press Enter
3. Should see message appear immediately

**User B:**
1. Should see "Test message 1" appear WITHOUT refreshing
2. If not, check browser console for errors

## Debugging Checklist

### For Sender (User A):

- [ ] WebSocket server running
- [ ] Browser console shows "WebSocket connected"
- [ ] Conversation is open
- [ ] Message appears after sending
- [ ] No errors in console

### For Receiver (User B):

- [ ] WebSocket server running
- [ ] Browser console shows "WebSocket connected"
- [ ] Conversation is open (clicked on User A)
- [ ] Browser console shows "Joined conversation: [id]"
- [ ] No errors in console

## Common Issues

### Issue 1: Receiver doesn't see messages

**Cause:** Receiver hasn't opened the conversation

**Solution:**
1. User B must click on User A in the DM list
2. Check browser console for "Joined conversation" message
3. If no message, refresh page and try again

### Issue 2: Messages appear after refresh but not in real-time

**Cause:** WebSocket server not running

**Solution:**
```bash
cd apps/server
bun run dev
```

### Issue 3: "WebSocket connection failed"

**Cause:** WebSocket server not running or wrong URL

**Check:**
1. Is server running? `curl http://localhost:3001`
2. Check `.env` file: `NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws`
3. Restart both servers

### Issue 4: Only 2 users can communicate

**Cause:** Other users haven't opened their conversations

**Solution:**
1. Each user must log in
2. Each user must click on the person they want to chat with
3. Each user must have the conversation OPEN
4. Then messages will be delivered in real-time

## How WebSocket Broadcasting Works

```
User A sends message
  ↓
Frontend → WebSocket → Server
  ↓
Server saves to database
  ↓
Server finds all users in conversation
  ↓
Server broadcasts to all CONNECTED users
  ↓
User B receives (if WebSocket connected AND conversation joined)
```

**Key Point:** User B must have:
1. WebSocket connected
2. Conversation joined (by opening it)

## Testing with Multiple Users

### Test 1: User A → User B

**User A (Browser 1 - Chrome):**
1. Log in as saijaswanth1728
2. Click on "Sai"
3. Send "Hello from A"

**User B (Browser 2 - Firefox):**
1. Log in as Sai
2. Click on "saijaswanth1728"
3. Should see "Hello from A"
4. Reply "Hi from B"

**User A should see "Hi from B" immediately**

### Test 2: User C → User D

**User C (Browser 3 - Chrome Incognito):**
1. Log in as coriuday
2. Click on "Ankith_raj_godugu"
3. Send "Hello from C"

**User D (Browser 4 - Edge):**
1. Log in as ankithrajgodugu
2. Click on "coriuday"
3. Should see "Hello from C"
4. Reply "Hi from D"

**User C should see "Hi from D" immediately**

## Server-Side Logging

The WebSocket server logs every message:

```
💬 New DM in conversation [id] from [user]. Broadcast to X connections.
```

If you see `Broadcast to 0 connections`, it means no one is connected to that conversation!

## Fix for Calls

Calls use the same WebSocket connection. If messaging works, calls should work too.

**To test calls:**
1. Ensure WebSocket server is running
2. Both users must be in the conversation
3. Click the video/voice call button
4. Check browser console for WebRTC signaling messages

## Production Deployment

For production, you MUST deploy the WebSocket server separately:

**Railway:**
```bash
cd apps/server
railway init
railway up
```

**Then update Vercel environment variable:**
```
NEXT_PUBLIC_WS_URL=wss://your-websocket-server.railway.app/ws
```

## Summary

✅ **WebSocket server must be running** - Most important!
✅ **Both users must open the conversation** - Click on each other
✅ **Check browser console** - Look for connection messages
✅ **Test with different browsers** - Not same browser tabs

**If WebSocket server is running and both users have the conversation open, messaging WILL work!**

---

**Quick Test:**
1. Start server: `cd apps/server && bun run dev`
2. Open Chrome: Log in as User A, click on User B
3. Open Firefox: Log in as User B, click on User A
4. Send message from User A
5. User B should see it immediately!
