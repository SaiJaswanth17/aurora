# Complete Messaging Test Guide

## The Problem

The session is being shared across tabs because Supabase uses localStorage by default. This is NORMAL behavior for web apps, but makes testing difficult.

## Solution: Test with Different Browsers or Devices

### Option 1: Use Different Browsers (RECOMMENDED)
1. **Browser 1 (Chrome)**: Log in as User A (saijaswanth1728)
2. **Browser 2 (Firefox)**: Log in as User B (Sai or coriuday)
3. Send messages between them

### Option 2: Use Incognito/Private Windows
1. **Normal Window**: Log in as User A
2. **Incognito Window** (Ctrl+Shift+N): Log in as User B
3. Send messages between them

### Option 3: Use Different Devices
1. **Device 1 (Computer)**: Log in as User A
2. **Device 2 (Phone/Tablet)**: Log in as User B
3. Send messages between them

## Step-by-Step Testing Instructions

### Step 1: Start the WebSocket Server (CRITICAL!)

```bash
# Open Terminal 1
cd apps/server
bun run dev
```

**You MUST see this message:**
```
🚀 WebSocket server running on ws://localhost:3001/ws
```

If you don't see this, messaging will NOT work in real-time!

### Step 2: Start the Web App

```bash
# Open Terminal 2
cd apps/web
bun run dev
```

### Step 3: Open Two Different Browsers

**Browser 1 (Chrome):**
1. Go to `http://localhost:3000`
2. Log in as `saijaswanth1728@gmail.com`
3. Click on "Sai" or "coriuday" in the DM list
4. Type "Hello from saijaswanth1728" and send

**Browser 2 (Firefox or Incognito Chrome):**
1. Go to `http://localhost:3000`
2. Log in as `saidj7654@gmail.com` (Sai)
3. You should see the conversation with saijaswanth1728
4. You should see the message "Hello from saijaswanth1728"
5. Reply with "Hi from Sai"

**Browser 1 should immediately show:**
- "Hi from Sai" message appears without refreshing

## What to Check

### In Browser Console (F12):

**Expected messages:**
```
✅ WebSocket connected to server
✅ WebSocket authentication successful
✅ Joined conversation: [conversation-id]
```

**If you see errors:**
```
❌ WebSocket connection failed
   → Start the WebSocket server!

❌ WebSocket authentication error
   → Log out and log in again

❌ Failed to load messages
   → Check browser console for API errors
```

## Current System State

```
✅ 4 users with profiles:
   - ankithrajgodugu@gmail.com (Ankith_raj_godugu)
   - saidj7654@gmail.com (Sai)
   - coriuday.18@gmail.com (coriuday)
   - saijaswanth1728@gmail.com (saijaswanth1728)

✅ 3 conversations:
   - saijaswanth1728 & Sai
   - saijaswanth1728 & coriuday
   - coriuday & Sai

✅ 0 messages (fresh start)
✅ Message insertion works
✅ Database is healthy
```

## Troubleshooting

### Issue: "WebSocket server is NOT running"

**Solution:**
```bash
cd apps/server
bun run dev
```

Wait for: `🚀 WebSocket server running on ws://localhost:3001/ws`

### Issue: Messages don't appear in real-time

**Checklist:**
1. ✅ WebSocket server running?
2. ✅ Browser console shows "WebSocket connected"?
3. ✅ Using different browsers/incognito?
4. ✅ Both users in the same conversation?

### Issue: "No messages yet" after sending

**Possible causes:**
1. API error - check browser console Network tab
2. Not a member of conversation - check conversation_members table
3. Message encrypted - should not happen anymore

**Solution:**
1. Open browser console (F12)
2. Go to Network tab
3. Send a message
4. Look for `/api/messages` POST request
5. Check if it returns 200 OK or an error

### Issue: Same user in both browsers

**This means you're using the same browser!**

**Solution:**
- Use Chrome in one window
- Use Firefox in another window
- OR use Chrome normal + Chrome incognito

## Testing Checklist

- [ ] WebSocket server is running (port 3001)
- [ ] Web app is running (port 3000)
- [ ] Using two DIFFERENT browsers or incognito
- [ ] Logged in as different users
- [ ] Browser console shows WebSocket connected
- [ ] Can send message from User A
- [ ] User B sees message immediately
- [ ] Can reply from User B
- [ ] User A sees reply immediately
- [ ] Messages persist after page refresh

## Production Deployment

For production, you need:

1. **Deploy WebSocket Server** to Railway/Render/Heroku
2. **Update environment variable** in Vercel:
   ```
   NEXT_PUBLIC_WS_URL=wss://your-websocket-server.com/ws
   ```
3. **Deploy frontend** to Vercel

## Why Session Shares Across Tabs

This is STANDARD web behavior:
- **Gmail**: Log out in one tab → logged out everywhere
- **Facebook**: Log in on one tab → logged in everywhere
- **Discord**: Same behavior
- **Your app**: Same behavior (this is correct!)

This is for **security** and **user experience**. It's NOT a bug!

---

**🎉 Follow these steps and messaging will work!**

The key is:
1. Start WebSocket server
2. Use different browsers
3. Check browser console for connection status
