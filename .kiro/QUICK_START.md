# Quick Start Guide - Aurora Chat

## Prerequisites

- Bun installed (`curl -fsSL https://bun.sh/install | bash`)
- Supabase account and project
- Two browsers for testing (Chrome + Firefox recommended)

## Setup (5 minutes)

### 1. Install Dependencies

```bash
# Install all dependencies
bun install

# Build shared package
cd packages/shared
bun run build
cd ../..
```

### 2. Configure Environment

**File: `apps/web/.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_WS_URL=ws://localhost:3002
```

**File: `apps/server/.env`**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
WS_PORT=3002
JWT_SECRET=your-jwt-secret-min-32-chars
```

### 3. Run Database Migrations

In Supabase SQL Editor, run all files in `supabase/migrations/` in order:
1. `001_initial_schema.sql`
2. `002_rls_policies.sql`
3. `003_storage_setup.sql`
4. `004_functions.sql`
5. `005_conversation_rpc.sql`

### 4. Start Servers

**Terminal 1 - WebSocket Server:**
```bash
cd apps/server
bun run dev
```

**Terminal 2 - Web App:**
```bash
cd apps/web
bun run dev
```

## Testing (2 minutes)

### Create Two Users

**Browser 1 (Chrome):**
1. Go to `http://localhost:3000`
2. Click "Register"
3. Create account: `alice@test.com` / `password123`

**Browser 2 (Firefox):**
1. Go to `http://localhost:3000`
2. Click "Register"
3. Create account: `bob@test.com` / `password123`

### Start Chatting

**In Browser 1 (Alice):**
1. Click the "+" button in sidebar (Direct Messages section)
2. Search for "bob"
3. Click "Start chat"
4. Type a message: "Hi Bob!"
5. Press Enter

**In Browser 2 (Bob):**
- Message should appear instantly!
- Type a reply: "Hey Alice!"

**Back in Browser 1:**
- Bob's reply should appear in real-time!

## What Should Happen

✅ **WebSocket Server Terminal:**
```
🔌 Connection opened: <connection-id>
✅ User authenticated: <user-id>
💬 New message in conversation <id> from <user-id>. Broadcast to 2 connections.
```

✅ **Web App Terminal:**
```
Creating conversation with participant: <user-id>
Current user: <your-user-id>
Creating new conversation...
Created conversation: <conversation-id>
Successfully created conversation with participants
```

✅ **Browser Console:**
```
WebSocket connected
auth_success
join_conversation
new_dm_message
```

## Common Issues

### "Unknown error" when starting chat
→ See `TROUBLESHOOTING.md`

### Messages not appearing
→ Check WebSocket connection in browser console
→ Verify both users are subscribed to conversation

### User always shows as online
→ Fixed! Status now updates in real-time
→ Enable Supabase Realtime for `profiles` table

### NPM workspace error
→ Ignore it - harmless warning from Next.js

## Next Steps

1. ✅ Test basic messaging
2. ✅ Test with multiple tabs (same user)
3. ✅ Test status updates (logout/login)
4. 📝 Implement message delivery confirmation
5. 📝 Add notification system
6. 📝 Improve error handling

## Features Working

- ✅ User authentication
- ✅ User search
- ✅ DM conversation creation
- ✅ Real-time messaging
- ✅ WebSocket auto-reconnection
- ✅ Typing indicators (implemented, needs testing)
- ✅ User status (online/offline/away/idle)
- ✅ Real-time status updates
- ✅ Rate limiting (10 msg/10sec)
- ✅ Message validation
- ✅ File attachments
- ✅ Voice messages

## Features Pending

- ⏳ Message edit/delete
- ⏳ Message pagination
- ⏳ Read receipts
- ⏳ Push notifications
- ⏳ Group chats
- ⏳ Message search

## Performance Tips

- Keep WebSocket server running continuously
- Don't restart servers unnecessarily
- Use browser DevTools Network tab to monitor traffic
- Check for memory leaks in long sessions

## Security Notes

- Encryption is temporarily disabled for debugging
- Re-enable before production deployment
- Use environment variables for all secrets
- Never commit `.env` files to git

## Support

- Check `TROUBLESHOOTING.md` for common issues
- Check `CHAT_IMPROVEMENTS.md` for feature roadmap
- Monitor browser console and server logs
- Test with network throttling for real-world conditions

---

**Happy Chatting! 🚀**
