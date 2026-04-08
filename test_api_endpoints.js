// Test script to verify all API endpoints return JSON
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'testuser@example.com',
  password: 'testpassword123'
};

// Helper function to make HTTP requests
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n=== ${method} ${path} ===`);
        console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
        console.log('Headers:', res.headers);
        
        // Check if response is JSON
        const contentType = res.headers['content-type'] || '';
        const isJson = contentType.includes('application/json');
        
        console.log(`Content-Type: ${contentType}`);
        console.log(`Is JSON: ${isJson}`);
        
        if (responseData) {
          console.log('Response length:', responseData.length, 'bytes');
          
          // Check if response starts with '<' (HTML)
          if (responseData.trim().startsWith('<')) {
            console.log('⚠️  WARNING: Response appears to be HTML!');
            console.log('First 200 chars:', responseData.substring(0, 200));
          } else if (isJson) {
            try {
              const parsed = JSON.parse(responseData);
              console.log('Response (parsed):', JSON.stringify(parsed, null, 2));
            } catch (e) {
              console.log('⚠️  ERROR: Failed to parse JSON!');
              console.log('Response:', responseData.substring(0, 500));
            }
          } else {
            console.log('Response:', responseData.substring(0, 500));
          }
        } else {
          console.log('Response: (empty)');
        }
        
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: responseData,
          isJson,
          parsed: isJson ? JSON.parse(responseData) : null
        });
      });
    });

    req.on('error', (error) => {
      console.error(`\n=== ERROR: ${method} ${path} ===`);
      console.error('Request failed:', error.message);
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('=== Testing API Endpoints ===');
  console.log('Base URL:', BASE_URL);
  console.log('Time:', new Date().toISOString());
  console.log('='.repeat(50));

  try {
    // Test 1: Health endpoint
    await makeRequest('GET', '/api/health');
    
    // Test 2: Root endpoint
    await makeRequest('GET', '/');
    
    // Test 3: Stripe test endpoint
    await makeRequest('GET', '/api/test-stripe');
    
    // Test 4: Auth debug endpoint
    await makeRequest('GET', '/auth/debug');
    
    // Test 5: Auth status endpoint
    await makeRequest('GET', '/auth/status');
    
    // Test 6: Login with wrong password (should return JSON error)
    await makeRequest('POST', '/auth/login', {
      email: TEST_USER.email,
      password: 'wrongpassword'
    });
    
    // Test 7: Login with correct password
    const loginResult = await makeRequest('POST', '/auth/login', {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    let authToken = null;
    if (loginResult.parsed && loginResult.parsed.token) {
      authToken = loginResult.parsed.token;
      console.log('\n✅ Login successful, token obtained');
    }
    
    // Test 8: Get user with JWT token
    if (authToken) {
      await makeRequest('GET', '/auth/me', null, {
        'Authorization': `Bearer ${authToken}`
      });
    }
    
    // Test 9: Test non-existent endpoint (should return JSON 404)
    await makeRequest('GET', '/api/nonexistent');
    
    // Test 10: Test with malformed JSON
    const malformedReq = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('\n=== Test: Malformed JSON ===');
        console.log(`Status: ${res.statusCode}`);
        console.log('Content-Type:', res.headers['content-type']);
        console.log('Response starts with:', data.substring(0, 50));
      });
    });
    
    malformedReq.write('{ malformed json }');
    malformedReq.end();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests completed');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Run tests
runTests().catch(console.error);