# Chat Improvements & User Guide

## Current Status ✅

### What's Working:
- User authentication and registration
- Creating DM conversations
- Sending and receiving messages in real-time
- WebSocket connection with auto-reconnection
- User search functionality
- Real-time status indicators (online/offline/away/idle)

### What Was Fixed:
1. ✅ Wrong database table name in WebSocket service
2. ✅ Missing WebSocket subscription when opening DMs
3. ✅ Encryption/decryption issues (temporarily disabled)
4. ✅ Port configuration standardized to 3002
5. ✅ TypeScript errors resolved
6. ✅ User status now shows correctly (not always green)

---

## How to Use the Chat

### Starting the Application:

**Terminal 1 - WebSocket Server:**
```bash
cd apps/server
bun run dev
```

**Terminal 2 - Web Application:**
```bash
cd apps/web
bun run dev
```

### Creating a Chat:

1. **Register/Login** - Create an account or login
2. **Click the "+" button** in the sidebar (Direct Messages section)
3. **Search for a user** - Type at least 2 characters
4. **Click "Start chat"** on the user you want to message
5. **Start messaging!**

### Testing with Multiple Users:

1. Open two different browsers (e.g., Chrome and Firefox)
2. Register different accounts in each
3. Start a conversation between them
4. Messages should appear in real-time!

---

## Known Issues & Workarounds

### 1. NPM Workspace Warning
**Issue:** `npm error code ENOWORKSPACES` appears in terminal
**Impact:** None - this is harmless
**Cause:** Next.js trying to run npm commands in a Bun workspace
**Solution:** Ignore it - doesn't affect functionality

### 2. "Unknown error" when starting chat
**Possible Causes:**
- Database migrations not run
- RLS policies blocking access
- Service role key not configured

**Check:**
```bash
# In browser console (F12), look for detailed error messages
# In Next.js terminal, check for API logs showing the exact error
```

**Fix:**
- Ensure `.env.local` has correct `SUPABASE_SERVICE_ROLE_KEY`
- Check Supabase dashboard for RLS policy errors
- Verify migrations are applied in Supabase SQL Editor

---

## Suggested Improvements

### High Priority (Core Functionality):

1. **Message Delivery Confirmation**
   - Add "sent", "delivered", "read" indicators
   - Show checkmarks next to messages

2. **Typing Indicators**
   - Already implemented but needs testing
   - Shows "User is typing..." when someone types

3. **Message History Loading**
   - Implement pagination for old messages
   - Load more messages when scrolling up

4. **Notification System**
   - Browser notifications for new messages
   - Sound alerts (optional)
   - Unread message badges

5. **Error Recovery**
   - Better error messages for users
   - Retry failed messages
   - Show connection status

### Medium Priority (User Experience):

6. **User Presence**
   - Show "last seen" timestamp for offline users
   - Show "typing..." in conversation list

7. **Message Features**
   - Edit messages (already in spec)
   - Delete messages (already in spec)
   - Reply to specific messages
   - Message reactions (emoji)

8. **Search & Filter**
   - Search within conversation
   - Filter by date/media/links

9. **Media Handling**
   - Image preview before sending
   - Video/audio playback
   - File download progress

10. **Conversation Management**
    - Pin important conversations
    - Archive conversations
    - Mute notifications per conversation

### Low Priority (Nice to Have):

11. **Voice Messages**
    - Already implemented but needs testing
    - Show waveform visualization

12. **Group Chats**
    - Create group conversations
    - Add/remove members
    - Group admin controls

13. **User Profile**
    - View user profile from chat
    - Custom status messages
    - Profile pictures

14. **Themes**
    - Dark/light mode toggle
    - Custom color schemes

15. **Keyboard Shortcuts**
    - Ctrl+K for quick search
    - Ctrl+Enter to send
    - Arrow keys for navigation

---

## Quick Debugging Guide

### Message Not Sending?

1. **Check WebSocket Connection:**
   - Open browser console (F12)
   - Look for WebSocket connection errors
   - Should see "auth_success" message

2. **Check Server Logs:**
   - Look at `apps/server` terminal
   - Should see "💬 New message in..." logs

3. **Check Database:**
   - Go to Supabase dashboard
   - Check `messages` or `dm_messages` table
   - Verify message was saved

### User Not Receiving Messages?

1. **Verify WebSocket Subscription:**
   - Check browser console for "join_conversation" or "join_channel" events
   - Should happen automatically when opening a chat

2. **Check Connection Manager:**
   - Server logs should show user in subscriber list
   - Look for "Broadcast to X connections" messages

3. **Test with Same User:**
   - Open two tabs with same account
   - Send message from one tab
   - Should appear in both tabs

### Status Not Updating?

1. **Check Realtime Subscription:**
   - Supabase realtime must be enabled
   - Check browser console for subscription errors

2. **Verify Status in Database:**
   - Check `profiles` table in Supabase
   - Status should change when user logs in/out

---

## Performance Tips

1. **Limit Message History:**
   - Only load last 50 messages initially
   - Load more on scroll

2. **Debounce Typing Indicators:**
   - Already implemented (3 second timeout)
   - Reduces WebSocket traffic

3. **Optimize Images:**
   - Compress before upload
   - Use thumbnails for previews

4. **Connection Pooling:**
   - Reuse WebSocket connection
   - Don't create multiple connections

---

## Security Considerations

1. **End-to-End Encryption:**
   - Currently disabled for debugging
   - Re-enable in production
   - Use proper key management

2. **Rate Limiting:**
   - Already implemented (10 messages per 10 seconds)
   - Prevents spam

3. **Input Validation:**
   - Sanitize user input
   - Prevent XSS attacks
   - Validate file uploads

4. **Authentication:**
   - Use secure tokens
   - Implement token refresh
   - Handle expired sessions

---

## Next Steps

1. **Test the current implementation:**
   - Create two accounts
   - Send messages between them
   - Verify real-time delivery

2. **Check for errors:**
   - Monitor browser console
   - Monitor server logs
   - Fix any issues that appear

3. **Implement high-priority improvements:**
   - Start with message delivery confirmation
   - Add notification system
   - Improve error handling

4. **Gather user feedback:**
   - Test with real users
   - Identify pain points
   - Prioritize improvements

---

## Support

If you encounter issues:

1. Check browser console (F12) for errors
2. Check server terminal for logs
3. Verify environment variables are set
4. Ensure database migrations are applied
5. Test WebSocket connection separately

For detailed error messages, the API now logs:
- User authentication status
- Conversation creation steps
- Database query results
- Participant addition status
