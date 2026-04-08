// Diagnostic script to help identify the "Unexpected token '<'" login issue
console.log('=== Diagnosing Login Issue: "Unexpected token \'<\'" ===\n');

console.log('This error typically occurs when:');
console.log('1. The backend server is not running');
console.log('2. The request URL is incorrect');
console.log('3. A proxy/browser is returning HTML instead of JSON');
console.log('4. Network/CORS issues\n');

console.log('=== Step 1: Check if backend is running ===');
console.log('Run this command to check:');
console.log('  curl -s http://localhost:3000/api/health');
console.log('');
console.log('Expected response: {"status":"OK","timestamp":"..."}');
console.log('');
console.log('If you get "Connection refused" or HTML, the server is not running.');
console.log('Start the server with:');
console.log('  cd backend && node index.js\n');

console.log('=== Step 2: Test login endpoint directly ===');
console.log('Run this command:');
console.log('  curl -X POST http://localhost:3000/auth/login \\');
console.log('    -H "Content-Type: application/json" \\');
console.log('    -d \'{"email":"test@example.com","password":"wrong"}\'');
console.log('');
console.log('Expected response (401): {"error":"Invalid credentials"}');
console.log('');
console.log('If you see HTML starting with "<", the server is not running correctly.\n');

console.log('=== Step 3: Check what\'s actually being returned ===');
console.log('To see the raw response (including headers), run:');
console.log('  curl -v -X POST http://localhost:3000/auth/login \\');
console.log('    -H "Content-Type: application/json" \\');
console.log('    -d \'{"email":"test@example.com","password":"wrong"}\'');
console.log('');
console.log('Look for:');
console.log('  - Status code (should be 401)');
console.log('  - Content-Type header (should be application/json)');
console.log('  - Response body (should be JSON, not HTML)\n');

console.log('=== Step 4: Common issues and solutions ===');
console.log('1. Server not running:');
console.log('   - Check if MongoDB is running: mongod');
console.log('   - Check if port 3000 is in use: netstat -ano | findstr :3000');
console.log('   - Kill existing process: taskkill /F /IM node.exe');
console.log('   - Restart: cd backend && node index.js\n');

console.log('2. Wrong URL:');
console.log('   - Frontend might be calling wrong URL');
console.log('   - Check frontend code for API calls');
console.log('   - Should be: http://localhost:3000/auth/login\n');

console.log('3. CORS issues:');
console.log('   - Check browser console for CORS errors');
console.log('   - Backend CORS is configured for localhost:5173,5174,5175');
console.log('   - If using different port, update FRONTEND_URL in .env\n');

console.log('4. Network/proxy issues:');
console.log('   - Try disabling VPN/proxy');
console.log('   - Check firewall settings');
console.log('   - Try different browser\n');

console.log('=== Step 5: Test with a working user ===');
console.log('Create a test user:');
console.log('  curl -X POST http://localhost:3000/auth/signup \\');
console.log('    -H "Content-Type: application/json" \\');
console.log('    -d \'{"email":"test@example.com","password":"password123","displayName":"Test"}\'');
console.log('');
console.log('Then login:');
console.log('  curl -X POST http://localhost:3000/auth/login \\');
console.log('    -H "Content-Type: application/json" \\');
console.log('    -d \'{"email":"test@example.com","password":"password123"}\'');
console.log('');
console.log('Expected: JSON with success:true and token\n');

console.log('=== Step 6: Verify backend configuration ===');
console.log('Check backend/.env file has:');
console.log('  - JWT_SECRET (any string)');
console.log('  - SESSION_SECRET (any string)');
console.log('  - MONGODB_URI=mongodb://localhost:27017/stiqr');
console.log('  - FRONTEND_URL includes your frontend port\n');

console.log('=== Step 7: Check frontend code ===');
console.log('In your frontend code, ensure:');
console.log('1. API calls use correct URL: http://localhost:3000/auth/login');
console.log('2. Headers include: "Content-Type": "application/json"');
console.log('3. Response is parsed as JSON: response.json()');
console.log('4. Error handling catches non-JSON responses\n');

console.log('=== Quick Test Script ===');
console.log('Run this to test everything at once:');
console.log('  node test_api_endpoints.js');
console.log('');
console.log('This will test all endpoints and show what\'s being returned.\n');

console.log('=== Summary ===');
console.log('The backend is currently configured to:');
console.log('✅ Always return JSON (even for errors)');
console.log('✅ Handle malformed JSON gracefully');
console.log('✅ Return proper Content-Type headers');
console.log('✅ Include health check endpoint at /api/health');
console.log('✅ Log all API responses for debugging');
console.log('');
console.log('If you\'re still getting "Unexpected token \'<\'", the issue is likely:');
console.log('1. Server not running when request is made');
console.log('2. Request going to wrong URL/port');
console.log('3. Network/proxy intercepting and returning HTML');