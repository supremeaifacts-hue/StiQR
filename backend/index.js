const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const passport = require('./config/passport');
const { connectDB } = require('./config/database');
const authRoutes = require('./routes/auth');
const assetsRoutes = require('./routes/assets');
const stripeRoutes = require('./routes/stripe');

// Load environment variables from .env file in backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Middleware
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5174,http://localhost:5175').split(',');
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Stripe webhook - MUST be defined BEFORE express.json()
app.post('/api/webhook', 
  express.raw({type: 'application/json'}), 
  async (req, res) => {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const User = require('./models/User');
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    console.log('📦 Webhook received');
    console.log('   Headers:', Object.keys(req.headers));
    console.log('   Body type:', typeof req.body);
    console.log('   Is Buffer:', Buffer.isBuffer(req.body));
    
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not set in .env');
      return res.status(500).send('Webhook secret not configured');
    }
    
    if (!sig) {
      console.error('❌ No stripe-signature header');
      return res.status(400).send('No signature header');
    }
    
    try {
      // Construct the event using the raw body Buffer
      const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      console.log('✅ Webhook verified:', event.type);
      
      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          
          // ADDED LOGS FOR DEBUGGING
          console.log('=== WEBHOOK RECEIVED ===');
          console.log('Event type:', event.type);
          console.log('Session client_reference_id:', session.client_reference_id);
          console.log('Session metadata:', session.metadata);
          
          console.log('💰 Payment successful for:', session.customer_email);
          console.log('   Customer ID:', session.customer);
          console.log('   Subscription ID:', session.subscription);
          
          // Get user ID from client_reference_id
          const userId = session.client_reference_id;
          
          if (!userId) {
            console.error('❌ No user ID found in session');
            console.error('   client_reference_id:', session.client_reference_id);
            console.error('   metadata:', session.metadata);
            return res.status(400).send('Missing user ID');
          }
          
          console.log('   Found user ID from client_reference_id:', userId);
          console.log('   Plan from metadata:', session.metadata?.plan || session.metadata?.planType);
          console.log('   Customer ID:', session.customer);
          console.log('   Subscription ID:', session.subscription);
          
          // ADDED LOG: Looking for user with ID
          console.log('Looking for user with ID:', userId);
          
          // Update the user in MongoDB
          const user = await User.findByIdAndUpdate(
            userId,
            {
              'subscription.stripeCustomerId': session.customer,
              'subscription.plan': session.metadata?.plan || session.metadata?.planType || 'pro',
              'subscription.isActive': true,
              'subscription.subscribedAt': new Date(),
              'subscription.stripeCurrentPeriodEnd': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            { new: true }
          );
          
          // ADDED LOG: User found?
          console.log('User found?', user ? 'Yes' : 'No');
          
          if (user) {
            console.log(`✅ User ${user.email} upgraded to ${user.subscription?.plan || 'pro'}`);
          } else {
            console.error(`❌ User not found with ID: ${userId}`);
          }
          break;
          
        case 'customer.subscription.deleted':
          console.log('📋 Subscription cancelled');
          // Handle cancellation
          break;
          
        default:
          console.log(`📋 Unhandled event type: ${event.type}`);
      }
      
      res.json({received: true});
    } catch (err) {
      console.error('❌ Webhook error:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// JSON parsing middleware for all other routes (must come AFTER webhook route)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware to log all API requests and ensure JSON responses
app.use((req, res, next) => {
  // Store the original json method
  const originalJson = res.json;
  
  // Override json method to log responses
  res.json = function(data) {
    console.log(`[API Response] ${req.method} ${req.originalUrl}`);
    console.log(`  Status: ${res.statusCode}`);
    console.log(`  Response type: ${typeof data}`);
    
    // Log error responses in detail
    if (res.statusCode >= 400) {
      console.log(`  Error response:`, JSON.stringify(data, null, 2));
    }
    
    // Call the original json method
    return originalJson.call(this, data);
  };
  
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/api', assetsRoutes);
app.use('/api/stripe', stripeRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'StickerQR backend running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes placeholder
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Stripe configuration test endpoint
app.get('/api/test-stripe', (req, res) => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeProPriceId = process.env.STRIPE_PRO_PRICE_ID;
  const stripeUltraPriceId = process.env.STRIPE_ULTRA_PRICE_ID;
  
  res.json({
    stripe: {
      secretKey: {
        exists: !!stripeSecretKey,
        length: stripeSecretKey ? stripeSecretKey.length : 0,
        first10Chars: stripeSecretKey ? stripeSecretKey.substring(0, 10) : null,
        startsWithSkTest: stripeSecretKey ? stripeSecretKey.startsWith('sk_test_') : false,
        isValidFormat: stripeSecretKey ? /^sk_(test|live)_[a-zA-Z0-9]+$/.test(stripeSecretKey) : false
      },
      publishableKey: {
        exists: !!stripePublishableKey,
        length: stripePublishableKey ? stripePublishableKey.length : 0,
        first10Chars: stripePublishableKey ? stripePublishableKey.substring(0, 10) : null,
        startsWithPkTest: stripePublishableKey ? stripePublishableKey.startsWith('pk_test_') : false
      },
      webhookSecret: {
        exists: !!stripeWebhookSecret,
        length: stripeWebhookSecret ? stripeWebhookSecret.length : 0
      },
      priceIds: {
        pro: {
          exists: !!stripeProPriceId,
          value: stripeProPriceId ? stripeProPriceId : null
        },
        ultra: {
          exists: !!stripeUltraPriceId,
          value: stripeUltraPriceId ? stripeUltraPriceId : null
        }
      },
      domain: process.env.DOMAIN || 'Not configured'
    },
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`Google OAuth Callback: ${process.env.GOOGLE_CALLBACK_URL || 'Not configured'}`);
});
