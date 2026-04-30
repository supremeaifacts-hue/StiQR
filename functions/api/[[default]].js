// File: /functions/api/[[default]].js
// This handles ALL requests to the EdgeOne Pages function route.
// It proxies API requests (/api/*, /auth/*) to the backend server,
// handles QR code tracking (/track/*), and lets EdgeOne serve
// the static site for all other paths.

// The backend server URL (your Express server running on port 3000)
const BACKEND_URL = 'http://localhost:3000';

export default async function onRequest(context) {
  // 1. Get the full URL and log it for debugging
  const url = new URL(context.request.url);
  console.log('📥 Request received:', url.pathname);
  
  // 2. Extract the path parts
  const pathParts = url.pathname.split('/').filter(part => part.length > 0);
  const firstSegment = pathParts[0];
  
  // 3. Handle API requests - proxy to backend server
  if (firstSegment === 'api' || firstSegment === 'auth') {
    console.log('🔄 Proxying API request to backend:', url.pathname);
    
    try {
      // Build the backend URL
      const backendUrl = `${BACKEND_URL}${url.pathname}${url.search}`;
      console.log('   Backend URL:', backendUrl);
      
      // Forward the request to the backend
      const response = await fetch(backendUrl, {
        method: context.request.method,
        headers: context.request.headers,
        body: context.request.method !== 'GET' && context.request.method !== 'HEAD' 
          ? context.request.body 
          : undefined,
      });
      
      // Return the backend response with CORS headers
      const responseHeaders = new Headers(response.headers);
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      responseHeaders.set('Access-Control-Allow-Credentials', 'true');
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      console.error('❌ Backend proxy error:', error.message);
      return new Response(JSON.stringify({ 
        error: 'Backend server unavailable',
        message: error.message 
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
  
  // 4. Handle tracking requests - paths starting with /track/
  if (firstSegment === 'track' && pathParts[1]) {
    const qrCodeId = pathParts[1];
    console.log('🔍 Looking up QR code ID:', qrCodeId);
    
    // Proxy to backend tracking endpoint
    try {
      const backendUrl = `${BACKEND_URL}/track/${qrCodeId}`;
      console.log('   Backend URL:', backendUrl);
      
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: context.request.headers,
      });
      
      // Return the backend response (which will be a redirect)
      return response;
    } catch (error) {
      console.error('❌ Tracking proxy error:', error.message);
      return new Response('Tracking service unavailable', { status: 502 });
    }
  }
  
  // 5. Handle OPTIONS preflight requests for CORS
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  
  // 6. For ALL other paths (root /, /dashboard, /login, static assets, etc.),
  //    return undefined so EdgeOne falls through to serve the static site.
  console.log('⏩ Not an API or tracking path, letting EdgeOne serve static site:', url.pathname);
  return undefined;
}
