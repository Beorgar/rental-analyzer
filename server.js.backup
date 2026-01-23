const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const stripe = require('stripe');
const Anthropic = require('@anthropic-ai/sdk');
const { ApifyClient } = require('apify-client');
const nodemailer = require('nodemailer');

dotenv.config();

const app = express();
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Email transporter
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Parse property URL and fetch data
app.post('/api/property/parse', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Detect platform
    let platform = 'unknown';
    if (url.includes('booking.com')) {
      platform = 'booking';
    } else if (url.includes('airbnb')) {
      platform = 'airbnb';
    } else if (url.includes('vrbo.com')) {
      platform = 'vrbo';
    } else {
      return res.status(400).json({ error: 'Unsupported platform. Please use Booking.com, Airbnb, or VRBO' });
    }

    // Fetch property data using Apify
    const propertyData = await fetchPropertyData(url, platform);

    res.json({
      success: true,
      platform,
      data: propertyData
    });
  } catch (error) {
    console.error('Error parsing property:', error);
    res.status(500).json({ error: 'Failed to parse property data', details: error.message });
  }
});

// Create payment intent
app.post('/api/payment/create-intent', async (req, res) => {
  try {
    const { amount, email, propertyId } = req.body;

    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amount, // in cents
      currency: 'usd',
      metadata: {
        email,
        propertyId,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Generate and send report
app.post('/api/report/generate', async (req, res) => {
  try {
    const { propertyData, email, paymentIntentId } = req.body;

    // Verify payment
    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Generate AI report
    const report = await generateAIReport(propertyData);

    // Send email with report
    await sendReportEmail(email, report, propertyData);

    res.json({
      success: true,
      message: 'Report has been sent to your email',
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
});

// Helper Functions

async function fetchPropertyData(url, platform) {
  // Mock data for demonstration
  // In production, use Apify actors to scrape real data

  // Example Apify integration:
  // const run = await apifyClient.actor('actor-id').call({ url });
  // const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

  return {
    id: Math.random().toString(36).substr(2, 9),
    url,
    platform,
    title: 'Beautiful Apartment in City Center',
    location: {
      address: '123 Main Street',
      city: 'New York',
      country: 'USA',
      latitude: 40.7128,
      longitude: -74.0060,
    },
    description: 'Spacious 2-bedroom apartment with modern amenities...',
    amenities: ['WiFi', 'Kitchen', 'Air conditioning', 'Heating', 'TV'],
    images: [
      'https://via.placeholder.com/800x600?text=Property+Image+1',
      'https://via.placeholder.com/800x600?text=Property+Image+2',
    ],
    pricing: {
      basePrice: 150,
      currency: 'USD',
      cleaningFee: 50,
    },
    capacity: {
      guests: 4,
      bedrooms: 2,
      beds: 2,
      bathrooms: 1,
    },
    rating: {
      average: 4.8,
      reviewCount: 127,
    },
  };
}

async function generateAIReport(propertyData) {
  const prompt = `Analyze this short-term rental property and provide a comprehensive pricing recommendation report for the next 3 months.

Property Details:
- Title: ${propertyData.title}
- Location: ${propertyData.location.city}, ${propertyData.location.country}
- Bedrooms: ${propertyData.capacity.bedrooms}
- Guests capacity: ${propertyData.capacity.guests}
- Current base price: $${propertyData.pricing.basePrice}/night
- Rating: ${propertyData.rating.average} (${propertyData.rating.reviewCount} reviews)
- Amenities: ${propertyData.amenities.join(', ')}

Please provide:

1. **Market Analysis**
   - Location demand assessment
   - Seasonal trends for the next 3 months
   - Competition analysis
   - Target audience identification

2. **Pricing Strategy**
   - Recommended base price per night
   - Weekend vs weekday pricing
   - Monthly pricing calendar with specific dates and prices
   - Minimum stay recommendations

3. **Revenue Optimization**
   - Expected occupancy rate
   - Projected monthly revenue
   - Dynamic pricing suggestions

4. **Property Improvements**
   - Description optimization suggestions
   - Photography improvement recommendations
   - Amenity additions that would increase value

5. **Competitive Positioning**
   - Key differentiators
   - Areas for improvement

Please format the report in clear sections with specific, actionable recommendations.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return message.content[0].text;
  } catch (error) {
    console.error('Error generating AI report:', error);
    throw new Error('Failed to generate AI analysis');
  }
}

async function sendReportEmail(email, report, propertyData) {
  const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    h2 { color: #3498db; margin-top: 30px; }
    .property-info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .upsell { background: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; margin: 30px 0; }
    .upsell h3 { color: #856404; margin-top: 0; }
    pre { white-space: pre-wrap; background: #f8f9fa; padding: 15px; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>🏠 Your Short-Term Rental Analysis Report</h1>

  <div class="property-info">
    <h3>Property Details</h3>
    <p><strong>Title:</strong> ${propertyData.title}</p>
    <p><strong>Location:</strong> ${propertyData.location.city}, ${propertyData.location.country}</p>
    <p><strong>Platform:</strong> ${propertyData.platform}</p>
  </div>

  <div style="margin: 30px 0;">
    <pre>${report}</pre>
  </div>

  <div class="upsell">
    <h3>🚀 Want to Maximize Your Revenue?</h3>
    <p>We offer professional services to help you get more bookings:</p>
    <ul>
      <li><strong>Description Optimization</strong> - Our expert copywriters will create compelling, SEO-optimized descriptions that convert visitors into bookings.</li>
      <li><strong>Professional Photography</strong> - High-quality photos can increase bookings by up to 40%. Let us enhance your property photos or arrange a professional shoot.</li>
    </ul>
    <p>Reply to this email to learn more about these services!</p>
  </div>

  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
  <p style="color: #777; font-size: 12px;">
    This report was generated using advanced AI analysis. For questions or support, reply to this email.
  </p>
</body>
</html>
  `;

  await emailTransporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Your Rental Analysis Report - ${propertyData.title}`,
    html: htmlReport,
  });
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
});
