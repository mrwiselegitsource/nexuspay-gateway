const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const app = express();

app.use(cors());
const path = require('path');
app.use(express.static(__dirname)); 
app.use(express.json());

// In-memory database to store active payment sessions (Note: resets on Vercel cold starts)
const sessions = new Map();

// Helper to get the dynamic base URL of the deployment (e.g. your-project.vercel.app)
const getBaseUrl = (req) => {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.headers['x-forwarded-host'] || req.get('host');
    return `${protocol}://${host}`;
};

// 1. Create a checkout session (Called by the Merchant's product page)
app.post('/api/checkout/sessions', (req, res) => {
  try {
    const { line_items, success_url, cancel_url } = req.body;
    
    // Strict Validation: Ensure the user's app sent a valid payload
    if (!line_items || !Array.isArray(line_items) || line_items.length === 0) {
      return res.status(400).json({ error: "Invalid payload: 'line_items' is required and must be an array." });
    }

    let calculatedAmountTotal = 0;
    for (let i = 0; i < line_items.length; i++) {
        const item = line_items[i];
        if (!item.price_data || typeof item.price_data.unit_amount !== 'number') {
            return res.status(400).json({ error: `Invalid payload: line_items[${i}] is missing a valid numeric 'price_data.unit_amount'.` });
        }
        calculatedAmountTotal += item.price_data.unit_amount;
    }

    if (calculatedAmountTotal <= 0) {
        return res.status(400).json({ error: "Invalid payload: Total amount must be greater than 0." });
    }

    // Generate a mock session ID just like Stripe does (e.g. cs_test_123...)
    const sessionId = 'cs_mock_' + crypto.randomBytes(16).toString('hex');
    
    // Save session in our "database"
    sessions.set(sessionId, {
      id: sessionId,
      lineItems: line_items,
      amountTotal: calculatedAmountTotal,
      successUrl: success_url,
      cancelUrl: cancel_url,
      status: 'open'
    });

    console.log(`[Gateway] Created new session: ${sessionId}`);

    // Return the dynamic URL where the user should be redirected to pay (Our hosted checkout page)
    const baseUrl = getBaseUrl(req);
    res.json({ url: `${baseUrl}/checkout.html?session_id=${sessionId}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Retrieve session details (Called by the hosted checkout page on load)
app.get('/api/checkout/sessions/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found or expired' });
  }
  res.json(session);
});

// 3. Process payment (Called when user clicks "Pay" on the checkout page)
app.post('/api/checkout/sessions/:id/pay', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  if (session.status !== 'open') {
    return res.status(400).json({ error: 'Session already paid' });
  }
  
  // For this mock, we assume the card is valid and simply mark it paid.
  session.status = 'complete';
  sessions.set(session.id, session);
  
  console.log(`[Gateway] Payment successful for session: ${session.id}`);

  // Tell the frontend where to redirect on success
  res.json({ success: true, redirect_url: session.successUrl });
});

// Export the app for Vercel Serverless Functions
module.exports = app;

// Only listen locally if not running in Vercel
if (require.main === module) {
    const PORT = process.env.PORT || 4242;
    app.listen(PORT, () => console.log(`Mock Stripe Gateway running on port ${PORT}...`));
}
