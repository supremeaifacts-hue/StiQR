// Test guide for Stripe checkout session endpoint with console logs
console.log('=== Testing Stripe Checkout Session Endpoint ===\n');

console.log('IMPORTANT: The backend server must be running on port 3000');
console.log('Check the backend terminal for console logs when testing.\n');

// Quick test without dependencies
console.log('Quick test: Check if endpoint is accessible (without auth):');
console.log('Run this command in another terminal:');
console.log('  curl -X POST http://localhost:3000/api/stripe/create-checkout-session \\');
console.log('    -H "Content-Type: application/json" \\');
console.log('    -d \'{"plan":"pro"}\'');
console.log('');
console.log('Expected result: 401 Unauthorized');
console.log('Check backend logs for: "=== /api/create-checkout-session endpoint called ==="');
console.log('');

console.log('\n2. Testing with invalid plan (should fail with 400):');
console.log('   Note: This requires authentication - check backend logs for details');
console.log('   Expected console logs in backend:');
console.log('   - "=== /api/create-checkout-session endpoint called ==="');
console.log('   - "1. Authentication check:"');
console.log('   - "2. User details:"');
console.log('   - "3. Plan request details:"');
console.log('   - "   ❌ Invalid plan type requested"');

console.log('\n3. Testing with valid plan "pro" (requires authentication):');
console.log('   Expected console logs in backend:');
console.log('   - All authentication logs');
console.log('   - "4. Stripe price ID validation:"');
console.log('   - "   ✅ Price ID validation passed"');
console.log('   - "5. Stripe customer handling:"');
console.log('   - "6. Creating checkout session..."');
console.log('   - Either success or error logs');

console.log('\n=== How to test manually ===');
console.log('1. Start the frontend: cd frontend && npm run dev');
console.log('2. Ensure backend is running (port 3000)');
console.log('3. Open browser to http://localhost:5174');
console.log('4. Log in with email/password (not demo user)');
console.log('5. Go to Pricing page');
console.log('6. Click "Upgrade to Pro" or "Upgrade to Ultra"');
console.log('7. Check backend terminal for console logs');
console.log('8. Check browser console for response');

console.log('\n=== Expected console log sections ===');
console.log('Section 1: Authentication check');
console.log('   - req.user exists: true/false');
console.log('   - req.isAuthenticated(): true/false');

console.log('\nSection 2: User details');
console.log('   - User ID: (MongoDB ObjectId)');
console.log('   - User email: (user email)');
console.log('   - Display name: (user name)');

console.log('\nSection 3: Plan request details');
console.log('   - Requested plan: pro/ultra');
console.log('   - Valid plan check: true/false');

console.log('\nSection 4: Stripe price ID validation');
console.log('   - Selected plan: pro/ultra');
console.log('   - Price ID from env: (Stripe price ID)');
console.log('   - Price ID exists: true/false');
console.log('   - STRIPE_PRO_PRICE_ID env: Set/Not set');
console.log('   - STRIPE_ULTRA_PRICE_ID env: Set/Not set');

console.log('\nSection 5: Stripe customer handling');
console.log('   - Existing customer ID: (Stripe customer ID or "None")');
console.log('   - Creating new Stripe customer... (if no existing customer)');
console.log('   - New customer created: (customer ID)');
console.log('   - Customer email: (user email)');
console.log('   - Customer name: (user display name)');
console.log('   - Customer ID saved to user database');

console.log('\nSection 6: Creating checkout session');
console.log('   - Customer ID: (Stripe customer ID)');
console.log('   - Price ID: (Stripe price ID)');
console.log('   - Domain: (domain from env)');
console.log('   - ✅ Checkout session created successfully (on success)');
console.log('   - Session ID: (Stripe session ID)');
console.log('   - Session URL: (Stripe checkout URL)');
console.log('   - Session mode: subscription');
console.log('   - Session status: open');

console.log('\nError Section (if any error occurs):');
console.log('   - ❌ Error creating Stripe customer: (error details)');
console.log('   - ❌ Error creating checkout session: (error details)');
console.log('   - === STRIPE API ERROR DETAILS ===');
console.log('   - Error type: (Stripe error type)');
console.log('   - Error message: (detailed error message)');
console.log('   - Error code: (Stripe error code)');
console.log('   - Error status code: (HTTP status code)');
console.log('   - Error raw: (raw Stripe error)');
console.log('   - Error stack: (stack trace)');
console.log('   - === END ERROR DETAILS ===');

console.log('\n=== Summary of added console logs ===');
console.log('1. Authentication status (req.user, req.isAuthenticated())');
console.log('2. User details (ID, email, display name)');
console.log('3. Plan validation (requested plan, valid check)');
console.log('4. Stripe price ID validation (env vars, price IDs)');
console.log('5. Stripe customer handling (existing/new customer)');
console.log('6. Checkout session creation (success/error details)');
console.log('7. Comprehensive error logging for Stripe API errors');