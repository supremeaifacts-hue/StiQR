// File: /functions/api/[[default]].js
// This handles ALL requests to /track/*

export default function onRequest(context) {
  // 1. Get the full URL and log it for debugging
  const url = new URL(context.request.url);
  console.log('📥 Request received:', url.pathname);
  
  // 2. Extract the QR code ID from the path
  //    Example: /track/mo1q7y60tuphezgnfp -> "mo1q7y60tuphezgnfp"
  const pathParts = url.pathname.split('/').filter(part => part.length > 0);
  
  // 3. Check if it's a tracking request
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
  
  // 6. If the path doesn't match /track/*, return a 404
  console.log('❌ No matching route for:', url.pathname);
  return new Response('Not Found', { status: 404 });
}