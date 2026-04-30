# Task Progress: Fix EdgeOne QR Code Redirect Function

## Issues Found

### Issue 1: `functions/[[default]].js` uses `require('mongoose')` - NOT compatible with EdgeOne Pages
EdgeOne Pages runs on a Service Worker-like environment (V8 isolates). It does NOT support `require()` or Node.js built-in modules like `mongoose`. The function tries to use `mongoose.connect()` which will fail because:
- `require('mongoose')` is not available in EdgeOne Pages runtime
- `mongoose.connect()` requires Node.js TCP sockets which don't exist in EdgeOne

### Issue 2: `functions/[[default]].js` uses deprecated Mongoose options
Lines 35-36 use `useNewUrlParser: true` and `useUnifiedTopology: true` which are deprecated/removed in newer Mongoose versions.

### Issue 3: `functions/[[default]].js` falls back to `https://www.example.com` on DB failure
When the database connection fails (which it always will in EdgeOne Pages), the function redirects to `https://www.example.com` instead of the intended destination URL.

### Issue 4: `functions/api/[[default]].js` proxies to `http://localhost:3000`
This file proxies tracking requests to `http://localhost:3000` which is the local development server. In EdgeOne Pages production, this will fail because there's no localhost:3000 available.

### Issue 5: `functions/api/[[default]].js` doesn't handle `/track/` paths directly
The file at `functions/api/[[default]].js` handles `/track/` paths by proxying to the backend, but the root `functions/[[default]].js` also tries to handle `/track/` paths. There's a routing conflict.

### Issue 6: The QR code image data contains the tracking URL, not the destination URL
When QR codes are created, the `imageData` field contains the QR code image encoded with the tracking URL. But the `data` field stores the original destination URL. The function correctly reads `qrCode.data` for the redirect, so this should work IF the DB connection worked.

## Fix Plan

1. **Rewrite `functions/[[default]].js`** to use a REST API approach instead of direct MongoDB connection:
   - Remove `mongoose` dependency
   - Instead of connecting to MongoDB directly, make an HTTP request to the backend's `/api/assets/qrcodes/:id` endpoint to get the destination URL
   - This works because EdgeOne Pages supports `fetch()` natively

2. **Fix `functions/api/[[default]].js`** to properly proxy tracking requests to the production backend URL instead of localhost

3. **Ensure environment variables** are properly documented for the EdgeOne console
