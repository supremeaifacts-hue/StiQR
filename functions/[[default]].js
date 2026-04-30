// /functions/[[default]].js
// This catches all requests to the domain
// EdgeOne Pages runs in a Node.js 18 runtime (see runtime.txt).
// It supports fetch() natively.
// We use fetch() to call the backend REST API instead of connecting to MongoDB directly.

// ============================================================
// BACKEND_URL - Hardcoded for now
// EdgeOne Pages does not expose process.env or context.env reliably.
// Once environment variables are properly configured in the EdgeOne console,
// replace this hardcoded value with the dynamic lookup below.
// ============================================================
const BACKEND_URL = 'https://www.stiqr.top'; // Hardcoded for now

// When EdgeOne env vars are working, uncomment this:
// function getBackendUrl(context) {
//   if (context && context.env && context.env.BACKEND_URL) return context.env.BACKEND_URL;
//   if (typeof process !== 'undefined' && process.env && process.env.BACKEND_URL) return process.env.BACKEND_URL;
//   return 'https://www.stiqr.top';
// }

export async function onRequest(context) {
  // ============================================================
  // DEBUG LOG 1: Incoming Request Details
  // ============================================================
  const url = new URL(context.request.url);
  const path = url.pathname;
  const method = context.request.method;
  const userAgent = context.request.headers.get('User-Agent') || 'unknown';
  const cfIp = context.request.headers.get('CF-Connecting-IP') || 'unknown';
  const xff = context.request.headers.get('X-Forwarded-For') || 'unknown';

  console.log('========================================');
  console.log('🔍 EDGEONE FUNCTION INVOKED');
  console.log('========================================');
  console.log(`   Timestamp:     ${new Date().toISOString()}`);
  console.log(`   Method:        ${method}`);
  console.log(`   Path:          ${path}`);
  console.log(`   Full URL:      ${url.href}`);
  console.log(`   User-Agent:    ${userAgent}`);
  console.log(`   CF-IP:         ${cfIp}`);
  console.log(`   X-Forwarded-For: ${xff}`);
  console.log(`   BACKEND_URL:   ${BACKEND_URL}`);
  console.log(`   context.env:   ${context && context.env ? JSON.stringify(Object.keys(context.env)) : 'not available'}`);
  console.log(`   process.env:   ${typeof process !== 'undefined' && process.env ? JSON.stringify(Object.keys(process.env)) : 'not available'}`);
  console.log('========================================');

  // ============================================================
  // TEST ENDPOINT: /test-env
  // Visit https://yourdomain.com/test-env to verify environment variables
  // ============================================================
  if (path === '/test-env') {
    console.log('🧪 TEST-ENV ENDPOINT HIT');
    console.log(`   BACKEND_URL:   ${BACKEND_URL}`);
    console.log(`   process.env:   ${typeof process !== 'undefined' ? JSON.stringify(Object.keys(process.env)) : 'process is undefined'}`);
    console.log('========================================\n');

    const envStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        BACKEND_URL: BACKEND_URL,
        configured: typeof process !== 'undefined' && process.env.BACKEND_URL ? true : false,
        process_available: typeof process !== 'undefined',
        env_keys: typeof process !== 'undefined' ? Object.keys(process.env) : []
      },
      note: 'MONGODB_URI and DB_NAME are NOT needed in EdgeOne. The function uses fetch() to call the backend API, not mongoose directly.'
    };

    return new Response(JSON.stringify(envStatus, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
  }

  // Handle /track/:id routes
  if (path.startsWith('/track/')) {
    const id = path.split('/')[2];
    
    // ============================================================
    // DEBUG LOG 2: QR Code ID Extraction
    // ============================================================
    console.log('📱 TRACKING ROUTE MATCHED');
    console.log(`   Raw path:      ${path}`);
    console.log(`   Path segments: ${JSON.stringify(path.split('/'))}`);
    console.log(`   Extracted ID:  ${id || '(empty - no ID found)'}`);
    console.log(`   ID length:     ${id ? id.length : 0}`);
    console.log(`   ID is valid:   ${id ? 'yes' : 'no'}`);
    
    if (!id) {
      console.error('❌ FAILED: No QR code ID found in path');
      console.log('========================================\n');
      return renderErrorPage(400, 'Missing QR Code ID', 'The QR code ID was not provided in the URL.');
    }

    console.log(`✅ QR Code ID received: ${id}`);
    console.log('========================================\n');

    try {
      // ============================================================
      // DEBUG LOG 3: Backend API Call
      // ============================================================
      const apiUrl = `${BACKEND_URL}/track/${encodeURIComponent(id)}`;
      console.log('🌐 ATTEMPTING BACKEND API CALL');
      console.log(`   API URL:       ${apiUrl}`);
      console.log(`   Method:        GET`);
      console.log(`   Headers:       ${JSON.stringify({
        'Accept': 'application/json',
        'User-Agent': userAgent
      })}`);
      console.log('   --- Fetching... ---');
      
      const startTime = Date.now();
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': userAgent
        }
      });
      const elapsed = Date.now() - startTime;

      // ============================================================
      // DEBUG LOG 4: Backend API Response
      // ============================================================
      console.log('📡 BACKEND API RESPONSE RECEIVED');
      console.log(`   Status:        ${response.status} ${response.statusText}`);
      console.log(`   Response time: ${elapsed}ms`);
      console.log(`   OK:            ${response.ok ? 'yes' : 'no'}`);

      if (!response.ok) {
        console.error(`❌ FAILED: Backend API returned error status ${response.status}`);
        
        // Try to read the error body for more details
        try {
          const errorBody = await response.text();
          console.error(`   Error body:    ${errorBody}`);
        } catch (e) {
          console.error(`   Error body:    (could not read: ${e.message})`);
        }
        console.log('========================================\n');
        
        if (response.status === 404) {
          return renderErrorPage(404, 'QR Code Not Found', 
            `The QR code with ID "${id}" was not found. It may have been deleted or the link may be invalid.`,
            'Check that the QR code is still active in your StiQR dashboard.'
          );
        }
        
        return renderErrorPage(502, 'Service Temporarily Unavailable',
          'The QR code lookup service is temporarily unavailable. Please try again later.',
          'If this issue persists, please contact support.'
        );
      }

      // ============================================================
      // DEBUG LOG 5: Response Body Parsing
      // ============================================================
      console.log('📦 PARSING RESPONSE BODY');
      let data;
      try {
        data = await response.json();
        console.log(`   Raw response:  ${JSON.stringify(data, null, 2).substring(0, 500)}`);
      } catch (e) {
        console.error(`❌ FAILED: Could not parse response as JSON: ${e.message}`);
        const rawText = await response.text();
        console.error(`   Raw text:      ${rawText.substring(0, 500)}`);
        console.log('========================================\n');
        return renderErrorPage(502, 'Invalid Response',
          'The QR code lookup service returned an invalid response.',
          'Please try again. If this issue persists, contact support.'
        );
      }
      
      console.log(`   has destination: ${data.destination ? 'yes' : 'no'}`);
      console.log(`   has error:       ${data.error ? 'yes : ' + data.error : 'no'}`);

      if (!data.destination) {
        console.error(`❌ FAILED: Response has no destination field`);
        console.error(`   Full response: ${JSON.stringify(data)}`);
        console.log('========================================\n');
        return renderErrorPage(404, 'QR Code Data Not Found',
          `The QR code with ID "${id}" exists but has no valid destination data.`,
          'Please recreate the QR code in your StiQR dashboard.'
        );
      }

      // ============================================================
      // DEBUG LOG 6: QR Code Data Found
      // ============================================================
      console.log('✅ QR CODE DATA FOUND');
      console.log(`   ID:            ${data.id || id}`);
      console.log(`   Name:          ${data.name || '(no name)'}`);
      console.log(`   Destination:   ${data.destination || '(empty!)'}`);
      console.log('========================================\n');

      // Get the destination URL
      let destinationUrl = data.destination;

      // ============================================================
      // DEBUG LOG 7: Destination URL Validation
      // ============================================================
      console.log('🔗 DESTINATION URL VALIDATION');
      console.log(`   Raw data:      ${destinationUrl || '(empty)'}`);
      console.log(`   Data length:   ${destinationUrl ? destinationUrl.length : 0}`);

      // Check if destinationUrl is empty or invalid
      if (!destinationUrl || destinationUrl.trim() === '') {
        console.error(`❌ FAILED: QR code data field is empty`);
        console.log('========================================\n');
        return renderErrorPage(400, 'QR Code Has No Destination',
          'This QR code does not have a destination URL configured.',
          'Please edit the QR code in your StiQR dashboard and set a destination URL.'
        );
      }

      // Check if data field contains a tracking URL (this would cause a loop)
      if (destinationUrl && destinationUrl.includes('/track/')) {
        console.error(`❌ FAILED: REDIRECT LOOP DETECTED`);
        console.error(`   The data field contains a tracking URL instead of a destination URL`);
        console.error(`   Value: ${destinationUrl}`);
        console.log('========================================\n');
        return renderErrorPage(400, 'Redirect Loop Detected',
          'This QR code is configured with a tracking URL instead of a destination URL, which would cause an infinite redirect loop.',
          'Please edit the QR code in your StiQR dashboard and set a proper destination URL (e.g., https://example.com).'
        );
      }

      // Ensure URL has protocol
      const hadProtocol = destinationUrl.startsWith('http://') || destinationUrl.startsWith('https://');
      if (!hadProtocol) {
        console.log(`   ⚠️ No protocol found, prepending https://`);
        destinationUrl = 'https://' + destinationUrl;
      }
      
      console.log(`   Had protocol:  ${hadProtocol ? 'yes' : 'no'}`);
      console.log(`   Final URL:     ${destinationUrl}`);
      console.log('========================================\n');

      // ============================================================
      // DEBUG LOG 8: Redirect Execution
      // ============================================================
      console.log('🚀 EXECUTING REDIRECT');
      console.log(`   Status:        302`);
      console.log(`   Location:      ${destinationUrl}`);
      console.log(`   ID:            ${id}`);
      console.log('========================================\n');

      // Record the scan asynchronously (fire and forget - don't block the redirect)
      recordScan(id, context).catch(err => {
        console.error(`⚠️ Failed to record scan for ID ${id}:`, err.message);
      });

      // Redirect to the destination
      return Response.redirect(destinationUrl, 302);
      
    } catch (error) {
      // ============================================================
      // DEBUG LOG 9: Unexpected Error
      // ============================================================
      console.error('💥 UNEXPECTED ERROR IN TRACKING ENDPOINT');
      console.error(`   Error name:    ${error.name || 'unknown'}`);
      console.error(`   Error message: ${error.message || 'unknown'}`);
      console.error(`   Error stack:   ${error.stack || 'no stack trace'}`);
      console.error(`   Error cause:   ${error.cause || 'none'}`);
      console.log('========================================\n');
      
      // IMPORTANT: Never redirect to homepage or any fallback URL.
      // Always return a proper error page so the user knows something went wrong.
      return renderErrorPage(502, 'Service Temporarily Unavailable',
        'An unexpected error occurred while processing your QR code.',
        'Please try scanning the QR code again. If this issue persists, contact support.',
        error.message
      );
    }
  }

  // Handle OPTIONS preflight requests for CORS
  if (method === 'OPTIONS') {
    console.log('🔄 OPTIONS preflight request - returning CORS headers');
    console.log('========================================\n');
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

  // For ALL other paths, return undefined so EdgeOne falls through to serve the static site.
  console.log(`⏩ Not a tracking path, letting EdgeOne serve static site: ${path}`);
  console.log('========================================\n');
  return undefined;
}

/**
 * Render a proper HTML error page.
 * This ensures users always see a meaningful error message instead of
 * being silently redirected to the homepage or some fallback URL.
 */
function renderErrorPage(statusCode, title, message, suggestion, debugInfo) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - StiQR</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 500px;
      text-align: center;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 48px 32px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .status-code {
      font-size: 72px;
      font-weight: 800;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 16px;
      color: #e0e0e0;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      color: #b0b0b0;
      margin-bottom: 12px;
    }
    .suggestion {
      background: rgba(102, 126, 234, 0.15);
      border-left: 3px solid #667eea;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      color: #c0c0c0;
      margin-top: 16px;
      text-align: left;
    }
    .debug {
      margin-top: 20px;
      font-size: 12px;
      color: #666;
      word-break: break-all;
    }
    .logo {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 24px;
      letter-spacing: 2px;
    }
    .logo span { color: #667eea; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">St<span>i</span>QR</div>
    <div class="status-code">${statusCode}</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    ${suggestion ? `<div class="suggestion">💡 ${escapeHtml(suggestion)}</div>` : ''}
    ${debugInfo ? `<div class="debug">${escapeHtml(debugInfo)}</div>` : ''}
  </div>
</body>
</html>`;

  return new Response(html, {
    status: statusCode,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

/**
 * Escape HTML special characters to prevent XSS.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Record a scan asynchronously by calling the backend scan endpoint.
 * This runs after the redirect response is sent so it doesn't block the user.
 */
async function recordScan(id, context) {
  try {
    const scanUrl = `${BACKEND_URL}/api/assets/qrcodes/${encodeURIComponent(id)}/scan`;
    
    console.log(`📝 Recording scan for ID: ${id}`);
    console.log(`   Scan URL: ${scanUrl}`);
    
    const scanResponse = await fetch(scanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': context.request.headers.get('User-Agent') || 'EdgeOne-Function'
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        ipAddress: context.request.headers.get('CF-Connecting-IP') || 
                   context.request.headers.get('X-Forwarded-For') || 
                   'unknown',
        userAgent: context.request.headers.get('User-Agent') || 'unknown',
        referer: context.request.headers.get('Referer') || ''
      })
    });
    
    console.log(`   Scan response status: ${scanResponse.status}`);
    
    if (scanResponse.ok) {
      console.log(`✅ Scan recorded successfully for ID: ${id}`);
    } else {
      const errorText = await scanResponse.text();
      console.error(`⚠️ Scan recording returned status ${scanResponse.status}: ${errorText}`);
    }
  } catch (error) {
    console.error(`❌ Failed to record scan for ID ${id}:`, error.message);
    console.error(`   Error stack: ${error.stack}`);
  }
}
