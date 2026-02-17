# Messaging Issue - Diagnosis & Fix

## Diagnostic Results

✅ **Database is healthy:**
- 4 users with valid profiles
- 3 conversations with proper memberships
- 140 messages stored correctly
- All conversation members are valid

## The Problem

Based on the screenshot, messages are being sent and stored in the database, but users cannot see each other's messages in real-time. This is a **WebSocket/Real-time delivery issue**, not a database issue.

## Root Causes

1. **WebSocket Server Not Running** - The WebSocket server (port 3001) may not be running
2. **WebSocket Connection Failed** - Frontend cannot connect to WebSocket server
3. **Message Broadcasting Issue** - Messages saved but not broadcast to other users

## Solution

### Step 1: Start the WebSocket Server

```bash
# Navigate to server directory
cd apps/server

# Start the WebSocket server
bun run src/index.ts
```

The server should start on port 3001 and show:
```
🚀 WebSocket server running on ws://localhost:3001/ws
```

### Step 2: Verify WebSocket Connection

Open browser console (F12) and check for:
- ✅ "WebSocket connected to server"
- ✅ "WebSocket authentication successful"

If you see errors:
- ❌ "WebSocket connection failed" - Server not running
- ❌ "WebSocket authentication error" - Token issue

### Step 3: Test Message Sending

1. User A sends message
2. Check browser console for: "Sending message via WebSocket"
3. Check server logs for: "💬 New message in conversation..."
4. User B should receive message immediately

## Quick Fix Commands

```bash
# Terminal 1: Start WebSocket Server
cd apps/server
bun run src/index.ts

# Terminal 2: Start Web App
cd apps/web
bun run dev

# Terminal 3: Check if server is running
curl http://localhost:3001/health
```

## Environment Variables

Make sure these are set in `.env`:

```env
# WebSocket Server
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws

# Or for production
NEXT_PUBLIC_WS_URL=wss://your-websocket-server.com/ws
```

## Testing Checklist

- [ ] WebSocket server is running (port 3001)
- [ ] Web app is running (port 3000)
- [ ] Browser console shows "WebSocket connected"
- [ ] User A can send message
- [ ] User B receives message in real-time
- [ ] Messages persist after page refresh

## Common Issues

### Issue 1: "WebSocket connection failed"
**Solution**: Start the WebSocket server
```bash
cd apps/server && bun run src/index.ts
```

### Issue 2: Messages not appearing in real-time
**Solution**: Check WebSocket connection in browser console
- Open DevTools (F12)
- Go to Console tab
- Look for WebSocket connection messages

### Issue 3: Messages appear after refresh but not in real-time
**Solution**: WebSocket broadcasting issue
- Check server logs for broadcast messages
- Verify users are in the same conversation
- Check conversation membership

## Production Deployment

For production, you need to:

1. **Deploy WebSocket Server** separately (e.g., on Railway, Render, or Heroku)
2. **Update environment variable**:
   ```env
   NEXT_PUBLIC_WS_URL=wss://your-websocket-server.com/ws
   ```
3. **Ensure CORS is configured** for your frontend domain

## Verification Script

Run this to verify everything is working:

```bash
# Check database
bun run apps/server/scripts/diagnose-messaging.ts

# Check WebSocket server
curl http://localhost:3001/health

# Check if port 3001 is listening
netstat -an | findstr "3001"
```

---

**Next Steps:**
1. Start the WebSocket server
2. Refresh both browser tabs
3. Try sending messages
4. Check browser console for connection status
