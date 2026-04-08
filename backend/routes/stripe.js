const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to check if user is authenticated (supports both JWT and Passport sessions)
const requireAuth = async (req, res, next) => {
  console.log('=== Authentication check in middleware ===');
  console.log('   - Request path:', req.path);
  console.log('   - Request method:', req.method);
  console.log('   - Authorization header:', req.headers.authorization ? 'Present' : 'Not present');
  
  // Check for JWT token in Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    console.log('   - JWT token detected, attempting verification...');
    
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('   - JWT token verified successfully');
      console.log('   - Decoded user ID:', decoded.userId);
      console.log('   - Decoded email:', decoded.email);
      
      // Find user in database
      const user = await User.findById(decoded.userId);
      if (!user) {
        console.log('   ❌ User not found in database for JWT token');
        return res.status(401).json({ error: 'User not found' });
      }
      
      // Attach user to request object
      req.user = user;
      req.authMethod = 'jwt';
      console.log('   - User attached to request (JWT auth)');
      console.log('   - User ID:', user._id);
      console.log('   - User email:', user.email);
      console.log('   ✅ JWT authentication passed');
      return next();
    } catch (jwtError) {
      console.log('   ❌ JWT token verification failed:', jwtError.message);
      // Continue to check session authentication
    }
  }
  
  // Check Passport session authentication (for Google OAuth users)
  console.log('   - Checking Passport session authentication...');
  console.log('   - req.isAuthenticated():', req.isAuthenticated());
  console.log('   - req.user exists:', !!req.user);
  
  if (req.isAuthenticated()) {
    req.authMethod = 'session';
    console.log('   - User ID:', req.user._id);
    console.log('   - User email:', req.user.email);
    console.log('   ✅ Session authentication passed');
    return next();
  }
  
  // No valid authentication found
  console.log('   ❌ No valid authentication found');
  console.log('   - No JWT token or valid session');
  console.log('   - Returning 401 Unauthorized');
  return res.status(401).json({ error: 'Authentication required' });
};

// Create checkout session
router.post('/create-checkout-session', requireAuth, async (req, res) => {
  try {
    // 1. Authentication logging
    console.log('=== /api/create-checkout-session endpoint called ===');
    console.log('1. Authentication check:');
    console.log('   - Authentication method:', req.authMethod || 'unknown');
    console.log('   - req.user exists:', !!req.user);
    console.log('   - req.isAuthenticated():', req.isAuthenticated());
    
    // 2. User details logging
    console.log('2. User details:');
    if (req.user) {
      console.log('   - User ID:', req.user._id);
      console.log('   - User email:', req.user.email);
      console.log('   - Display name:', req.user.displayName);
      console.log('   - Auth provider:', req.user.authProvider);
    } else {
      console.log('   - No user object found');
    }
    
    const { plan } = req.body;
    const userId = req.user._id;
    
    // 3. Plan type logging
    console.log('3. Plan request details:');
    console.log('   - Requested plan:', plan);
    console.log('   - Valid plan check:', plan && ['pro', 'ultra'].includes(plan));
    
    if (!plan || !['pro', 'ultra'].includes(plan)) {
      console.log('   ❌ Invalid plan type requested');
      return res.status(400).json({ error: 'Valid plan type required (pro or ultra)' });
    }
    
    // Get price ID based on plan
    const priceId = plan === 'pro' 
      ? process.env.STRIPE_PRO_PRICE_ID 
      : process.env.STRIPE_ULTRA_PRICE_ID;
    
    // 4. Stripe price ID validation logging
    console.log('4. Stripe price ID validation:');
    console.log('   - Selected plan:', plan);
    console.log('   - Price ID from env:', priceId);
    console.log('   - Price ID exists:', !!priceId);
    console.log('   - STRIPE_PRO_PRICE_ID env:', process.env.STRIPE_PRO_PRICE_ID ? 'Set' : 'Not set');
    console.log('   - STRIPE_ULTRA_PRICE_ID env:', process.env.STRIPE_ULTRA_PRICE_ID ? 'Set' : 'Not set');
    
    if (!priceId) {
      console.log('   ❌ Price ID not configured in environment variables');
      return res.status(500).json({ error: 'Price ID not configured' });
    }
    
    console.log('   ✅ Price ID validation passed');
    
    // Get or create Stripe customer
    let customerId = req.user.subscription?.stripeCustomerId;
    
    console.log('5. Stripe customer handling:');
    console.log('   - Existing customer ID:', customerId || 'None');
    
    if (!customerId) {
      console.log('   - Creating new Stripe customer...');
      try {
        // Create new Stripe customer
        const customer = await stripe.customers.create({
          email: req.user.email,
          name: req.user.displayName,
          metadata: {
            userId: userId.toString()
          }
        });
        
        customerId = customer.id;
        console.log('   - New customer created:', customerId);
        console.log('   - Customer email:', customer.email);
        console.log('   - Customer name:', customer.name);
        
        // Save customer ID to user
        await User.findByIdAndUpdate(userId, {
          'subscription.stripeCustomerId': customerId
        });
        console.log('   - Customer ID saved to user database');
      } catch (customerError) {
        console.error('   ❌ Error creating Stripe customer:', customerError);
        console.error('   - Error type:', customerError.type);
        console.error('   - Error message:', customerError.message);
        console.error('   - Error code:', customerError.code);
        throw customerError;
      }
    } else {
      console.log('   - Using existing customer ID:', customerId);
    }
    
    console.log('6. Creating checkout session...');
    console.log('   - Customer ID:', customerId);
    console.log('   - Price ID:', priceId);
    
    // Get frontend URL from request origin or use environment variable
    const frontendOrigin = req.headers.origin || process.env.FRONTEND_LOCAL_URL || 'http://localhost:5173';
    console.log('   - Frontend Origin:', frontendOrigin);
    console.log('   - All headers:', req.headers);
    
    try {
      // Create checkout session with localhost URLs for testing
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${frontendOrigin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendOrigin}/pricing`,
        client_reference_id: userId.toString(), // ✅ CRITICAL - user ID for webhook
        metadata: {
          userId: userId.toString(),
          plan: plan
        },
        subscription_data: {
          metadata: {
            userId: userId.toString(),
            plan: plan
          }
        }
      });
      
      console.log('   ✅ Checkout session created successfully');
      console.log('   - Session ID:', session.id);
      console.log('   - Session URL:', session.url);
      console.log('   - Session mode:', session.mode);
      console.log('   - Session status:', session.status);
      
      res.json({ url: session.url });
      
    } catch (sessionError) {
      console.error('   ❌ Error creating checkout session:', sessionError);
      console.error('   - Error type:', sessionError.type);
      console.error('   - Error message:', sessionError.message);
      console.error('   - Error code:', sessionError.code);
      console.error('   - Full error details:', JSON.stringify(sessionError, null, 2));
      throw sessionError;
    }
    
  } catch (error) {
    console.error('=== STRIPE API ERROR DETAILS ===');
    console.error('Error type:', error.type);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error status code:', error.statusCode);
    console.error('Error raw:', error.raw ? JSON.stringify(error.raw, null, 2) : 'No raw error data');
    console.error('Error stack:', error.stack);
    console.error('=== END ERROR DETAILS ===');
    
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
});

// Get subscription portal URL
router.post('/create-portal-session', requireAuth, async (req, res) => {
  try {
    const customerId = req.user.subscription?.stripeCustomerId;
    
    if (!customerId) {
      return res.status(400).json({ error: 'No Stripe customer found' });
    }
    
    // Get frontend URL from request origin or use environment variable
    const frontendOrigin = req.headers.origin || process.env.FRONTEND_LOCAL_URL || 'http://localhost:5173';
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${frontendOrigin}/dashboard`,
    });
    
    res.json({ url: portalSession.url });
    
  } catch (error) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// Get subscription status
router.get('/subscription-status', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('subscription');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      plan: user.subscription.plan,
      isActive: user.subscription.isActive,
      trialEndsAt: user.subscription.trialEndsAt,
      subscribedAt: user.subscription.subscribedAt,
      expiresAt: user.subscription.expiresAt,
      stripeCurrentPeriodEnd: user.subscription.stripeCurrentPeriodEnd,
      stripeCancelAtPeriodEnd: user.subscription.stripeCancelAtPeriodEnd
    });
    
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

module.exports = router;