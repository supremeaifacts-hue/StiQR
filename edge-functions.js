// edge-functions.js
export default async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  // ============================================================
  // 1. Handle tracking requests: /track/:id
  // ============================================================
  if (pathname.startsWith('/track/')) {
    const qrCodeId = pathname.split('/')[2];
    console.log(`🔍 Tracking request for QR code ID: ${qrCodeId}`);
    // For now, just return a simple response to prove the function is running
    return new Response(`Tracking function is working! ID: ${qrCodeId}`, { status: 200 });
  }

  // ============================================================
  // 2. Handle API/Auth requests: proxy to backend server
  //    This is needed because the frontend sends API requests
  //    to www.stiqr.top/api/* which need to reach the backend.
  // ============================================================
  const firstSegment = pathname.split('/').filter(Boolean)[0];
  if (firstSegment === 'api' || firstSegment === 'auth') {
    console.log(`🔄 Proxying ${firstSegment} request to backend: ${pathname}`);
    
    try {
      const BACKEND_URL = 'https://www.stiqr.top';
      const backendUrl = `${BACKEND_URL}${pathname}${url.search}`;
      
      const response = await fetch(backendUrl, {
        method: context.request.method,
        headers: context.request.headers,
        body: context.request.method !== 'GET' && context.request.method !== 'HEAD'
          ? context.request.body
          : undefined,
      });
      
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

  // ============================================================
  // 3. Handle OPTIONS preflight requests for CORS
  // ============================================================
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

  // ============================================================
  // 4. For all other paths, let EdgeOne serve the static frontend
  // ============================================================
  return context.next();
}
