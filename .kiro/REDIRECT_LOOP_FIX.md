# Fix for "Redirecting to app..." Loop

## The Problem
The app was storing authentication state in browser localStorage. When you visit the login page, it sees the old stored state and thinks you're logged in, causing an infinite redirect loop.

## The Solution
I've fixed the code to properly check the actual session on page load. However, you need to clear the old stored data from your browser.

## How to Fix (Choose ONE method)

### Method 1: Clear Browser Data (Recommended)
1. Press `Ctrl + Shift + Delete` (or `Cmd + Shift + Delete` on Mac)
2. Select "Cookies and other site data"
3. Select "Cached images and files"
4. Click "Clear data"
5. Refresh the page

### Method 2: Use Browser Console
1. Press `F12` to open Developer Tools
2. Go to the "Console" tab
3. Type this command and press Enter:
   ```javascript
   localStorage.clear(); location.reload();
   ```
4. The page will refresh and the login form should appear

### Method 3: Use Incognito/Private Window
1. Open a new Incognito/Private window
   - Chrome: `Ctrl + Shift + N`
   - Firefox: `Ctrl + Shift + P`
   - Edge: `Ctrl + Shift + N`
2. Navigate to `localhost:3000/login`
3. Login normally

### Method 4: Clear Specific Storage
1. Press `F12` to open Developer Tools
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Expand "Local Storage" in the left sidebar
4. Click on your site (localhost:3000)
5. Find the key `aurora-auth-storage`
6. Right-click and select "Delete"
7. Refresh the page

## After Clearing Storage

1. You should see the login form
2. Enter your credentials
3. After successful login, you'll be redirected to `/channels/me`
4. The redirect should work smoothly now

## Why This Happened

The previous code was:
1. Storing auth state in localStorage
2. Not checking if the stored session was still valid
3. Showing "authenticated" based on old data
4. Trying to redirect, but middleware was blocking it

The new code:
1. Still uses localStorage for convenience
2. BUT checks the actual session on page load
3. Clears invalid stored data automatically
4. Only redirects when truly authenticated

## Testing the Fix

After clearing storage:

1. **Login Test:**
   - Go to `/login`
   - Enter credentials
   - Should redirect to `/channels/me` within 1 second

2. **Logout Test:**
   - Click logout
   - Should redirect to `/login`
   - Should NOT show "Redirecting..." loop

3. **Refresh Test:**
   - While logged in, refresh the page
   - Should stay on the same page
   - Should NOT redirect to login

4. **Direct URL Test:**
   - While logged out, try to visit `/channels/me`
   - Should redirect to `/login`
   - Should show login form (not redirect loop)

## Still Having Issues?

If you're still seeing the redirect loop after clearing storage:

1. **Check Browser Console (F12):**
   - Look for any error messages
   - Share them with me

2. **Try Different Browser:**
   - Use a different browser to test
   - This confirms it's a storage issue

3. **Check Network Tab:**
   - Open F12 → Network tab
   - Refresh the page
   - Look for any failed requests
   - Check if `/api/auth` calls are succeeding

4. **Verify Environment Variables:**
   ```bash
   # In apps/web/.env.local
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```

## For Development

If you're developing and want to test login/logout frequently:

1. Use Incognito windows for testing
2. Or use this console command to quickly clear auth:
   ```javascript
   localStorage.removeItem('aurora-auth-storage'); location.reload();
   ```

## What Changed in the Code

### Before:
```typescript
// Login page would check persisted state
if (isAuthenticated) {
  // Redirect immediately based on localStorage
  router.push('/channels/me');
}
```

### After:
```typescript
// Auth context now checks actual session first
const checkInitialSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    setUser(null); // Clear invalid persisted state
  }
};
```

This ensures the app always checks the real session status, not just what's stored in localStorage.
