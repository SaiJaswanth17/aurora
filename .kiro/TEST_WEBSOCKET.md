# WebSocket Connection Test

## Quick Test in Browser Console

Open browser console (F12) and paste this:

```javascript
// Test WebSocket connection
const ws = new WebSocket('ws://localhost:3002/ws');

ws.onopen = () => {
  console.log('✅ WebSocket connected!');
  
  // Try to authenticate (replace with your actual token)
  const token = 'your-token-here'; // Get from localStorage
  ws.send(JSON.stringify({
    type: 'auth',
    payload: { token }
  }));
};

ws.onmessage = (event) => {
  console.log('📨 Message received:', event.data);
  const data = JSON.parse(event.data);
  
  if (data.type === 'auth_success') {
    console.log('✅ Authentication successful!', data.payload);
  } else if (data.type === 'auth_error') {
    console.error('❌ Authentication failed:', data.payload);
  }
};

ws.onerror = (error) => {
  console.error('❌ WebSocket error:', error);
};

ws.onclose = (event) => {
  console.log('🔌 WebSocket closed:', event.code, event.reason);
};
```

## Get Your Auth Token

```javascript
// In browser console:
const authData = JSON.parse(localStorage.getItem('aurora-auth-storage'));
console.log('User:', authData?.state?.user);
console.log('Authenticated:', authData?.state?.isAuthenticated);

// Get Supabase session token
(async () => {
  const { createClient } = await import('./lib/supabase/client');
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  console.log('Session token:', session?.access_token);
  console.log('Token length:', session?.access_token?.length);
})();
```

## Expected Results

### If Working:
```
✅ WebSocket connected!
📨 Message received: {"type":"auth_success","payload":{...}}
✅ Authentication successful!
```

### If Auth Fails:
```
✅ WebSocket connected!
📨 Message received: {"type":"auth_error","payload":{...}}
❌ Authentication failed: ...
```

### If Connection Fails:
```
❌ WebSocket error: ...
🔌 WebSocket closed: 1006 ...
```

## Common Issues

### Issue 1: No Token
**Symptom:** `Session token: undefined`
**Fix:** Logout and login again

### Issue 2: Invalid Token
**Symptom:** `auth_error: Invalid token`
**Fix:** Token might be expired, logout and login again

### Issue 3: Connection Refused
**Symptom:** `WebSocket error: Connection refused`
**Fix:** WebSocket server not running, start it with `bun run dev`

### Issue 4: Wrong URL
**Symptom:** `WebSocket closed: 1006`
**Fix:** Check URL is `ws://localhost:3002/ws` (note the `/ws`)

## Server Logs to Check

In your server terminal, you should see:

```
🔐 Auth attempt received, payload: { token: '...' }
✅ Auth payload validated, token length: 234
✅ User authenticated: user-id username
✅ Auth success sent to client
```

If you see:
```
❌ Auth validation failed: ...
❌ Auth error: ...
```

Then check what the error message says.

## Quick Fix Steps

1. **Logout and Login Again**
   - Click logout
   - Login with your credentials
   - This refreshes your session token

2. **Check Environment Variables**
   - Verify `NEXT_PUBLIC_SUPABASE_URL` is set
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is set
   - Restart servers after changing env vars

3. **Clear Browser Cache**
   - Clear localStorage
   - Clear cookies
   - Hard refresh (Ctrl+Shift+R)

4. **Restart Both Servers**
   ```bash
   # Terminal 1
   cd apps/server
   bun run dev
   
   # Terminal 2
   cd apps/web
   bun run dev
   ```

5. **Check Supabase Dashboard**
   - Go to Authentication > Users
   - Verify your user exists
   - Check if user has a profile in Database > profiles table
