const Anthropic = require('@anthropic-ai/sdk');
const nodemailer = require('nodemailer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { propertyData, email, paymentIntentId } = req.body;

    // Verify payment
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Generate AI report
    const report = await generateAIReport(propertyData);

    // Send email with report
    await sendReportEmail(email, report, propertyData);

    res.status(200).json({
      success: true,
      message: 'Report has been sent to your email',
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      error: 'Failed to generate report',
      details: error.message
    });
  }
};

async function generateAIReport(propertyData) {
  // Get current date for analysis
  const currentDate = new Date();
  const dateStr = currentDate.toISOString().split('T')[0];

  const prompt = `You are an expert in short-term rental pricing and revenue optimization. Analyze this property and provide a comprehensive pricing recommendation report for the next 3 months.

TODAY'S DATE: ${dateStr}

Property Details:
- Title: ${propertyData.title}
- Location: ${propertyData.location.city}, ${propertyData.location.country}
- Bedrooms: ${propertyData.capacity.bedrooms}
- Guests capacity: ${propertyData.capacity.guests}
- Current base price: $${propertyData.pricing.basePrice}/night
- Rating: ${propertyData.rating.average} (${propertyData.rating.reviewCount} reviews)
- Amenities: ${propertyData.amenities.join(', ')}

IMPORTANT REQUIREMENTS:
- Research and include ALL local/national holidays and public holidays for ${propertyData.location.country} in the next 3 months
- Include school vacation periods (winter break, spring break, summer holidays)
- Identify major local events, festivals, conferences, and sports events in ${propertyData.location.city}
- Consider seasonal tourism patterns specific to this region
- Account for weekend vs weekday demand patterns

Please provide:

1. **Market Analysis**
   - Location demand assessment with specific regional insights
   - Seasonal trends for the next 3 months
   - **LOCAL EVENTS CALENDAR:** List ALL upcoming holidays, school vacations, festivals, and major events with specific dates
   - Competition analysis
   - Target audience identification (business travelers, tourists, families, etc.)

2. **Pricing Strategy with Events-Based Recommendations**
   - Recommended base price per night for regular days
   - Weekend vs weekday pricing
   - **HOLIDAY & EVENT PRICING:** Specific price recommendations for each holiday/event period
   - **MONTHLY PRICING CALENDAR:** Week-by-week breakdown for next 3 months with:
     * Specific date ranges
     * Recommended nightly rate
     * Reasoning (holiday, event, regular period, etc.)
   - Minimum stay recommendations (adjust for high-demand periods)

3. **Revenue Optimization**
   - Expected occupancy rate (monthly breakdown)
   - Projected monthly revenue with event-adjusted pricing
   - Dynamic pricing suggestions:
     * When to raise prices (before/during holidays and events)
     * When to offer discounts (low-demand periods)
     * Last-minute pricing strategy

4. **Property Improvements**
   - Description optimization suggestions (highlight proximity to attractions)
   - Photography improvement recommendations
   - Amenity additions that would increase value
   - Marketing suggestions for upcoming high-demand periods

5. **Competitive Positioning**
   - Key differentiators
   - Areas for improvement
   - How to capitalize on upcoming local events

FORMAT REQUIREMENTS:
- Use clear sections with headers
- Include specific dates and price points
- Highlight high-demand periods with 📅 emoji
- Use tables or lists for pricing calendars
- Provide actionable, specific recommendations
- Include currency symbol appropriate to location`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-latest',
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
  const emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

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
