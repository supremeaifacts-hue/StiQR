// File: /functions/api/[[default]].js
// This handles ALL requests to the EdgeOne Pages function route.
// It ONLY intercepts /track/* requests for QR code redirects.
// For all other paths (like root /, /dashboard, etc.), it returns
// undefined so EdgeOne serves the static site normally.

export default function onRequest(context) {
  // 1. Get the full URL and log it for debugging
  const url = new URL(context.request.url);
  console.log('📥 Request received:', url.pathname);
  
  // 2. Extract the path parts
  //    Example: /track/mo1q7y60tuphezgnfp -> ["track", "mo1q7y60tuphezgnfp"]
  const pathParts = url.pathname.split('/').filter(part => part.length > 0);
  
  // 3. ONLY handle tracking requests - paths starting with /track/
  if (pathParts[0] === 'track' && pathParts[1]) {
    const qrCodeId = pathParts[1];
    console.log('🔍 Looking up QR code ID:', qrCodeId);
    
    // 4. --- IMPORTANT: Replace this with your actual database lookup ---
    // For now, use a test destination to verify the function works
    // Once verified, replace this with your MongoDB lookup logic
    const destination = 'https://www.google.com';
    console.log('➡️ Redirecting to:', destination);
    
    // 5. Return a 302 redirect
    return Response.redirect(destination, 302);
  }
  
  // 6. For ALL other paths (root /, /dashboard, /login, static assets, etc.),
  //    return undefined so EdgeOne falls through to serve the static site.
  //    This prevents the redirect loop and 404 errors on the main site.
  console.log('⏩ Not a /track/* path, letting EdgeOne serve static site:', url.pathname);
  return undefined;
}
