const Anthropic = require('@anthropic-ai/sdk');

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

  try {
    // Demo property data for testing - Paul's Studio in Austria
    const propertyData = {
      title: "Paul's Studio - Cozy Apartment near Vienna",
      location: {
        city: 'Vienna',
        country: 'Austria',
      },
      capacity: {
        bedrooms: 1,
        guests: 2,
      },
      pricing: {
        basePrice: 85,
      },
      rating: {
        average: 4.7,
        reviewCount: 89,
      },
      amenities: ['WiFi', 'Kitchen', 'Heating', 'TV', 'Free Parking', 'Near Public Transport'],
    };

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
- Include currency symbol appropriate to location (EUR for Austria)`;

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

    const report = message.content[0].text;

    // Return HTML formatted response
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AI Report Test</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    }
    h1 {
      color: #667eea;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
    }
    h2 {
      color: #764ba2;
      margin-top: 30px;
    }
    .success {
      background: #d4edda;
      color: #155724;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
      border-left: 4px solid #28a745;
    }
    .property-info {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    pre {
      white-space: pre-wrap;
      background: #f8f9fa;
      padding: 20px;
      border-radius: 5px;
      line-height: 1.8;
    }
    .back-btn {
      background: #667eea;
      color: white;
      padding: 12px 30px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      margin-top: 20px;
    }
    .back-btn:hover {
      background: #764ba2;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🤖 AI Report Generation Test</h1>

    <div class="success">
      ✅ <strong>Success!</strong> ANTHROPIC_API_KEY is working correctly. Claude AI generated the report below.
    </div>

    <div class="property-info">
      <h3>Test Property Details</h3>
      <p><strong>Title:</strong> ${propertyData.title}</p>
      <p><strong>Location:</strong> ${propertyData.location.city}, ${propertyData.location.country}</p>
      <p><strong>Bedrooms:</strong> ${propertyData.capacity.bedrooms} | <strong>Guests:</strong> ${propertyData.capacity.guests}</p>
      <p><strong>Current Price:</strong> $${propertyData.pricing.basePrice}/night</p>
      <p><strong>Rating:</strong> ${propertyData.rating.average} ⭐ (${propertyData.rating.reviewCount} reviews)</p>
    </div>

    <h2>📊 Generated AI Report</h2>
    <pre>${report}</pre>

    <a href="/" class="back-btn">← Back to Home</a>
  </div>
</body>
</html>
    `);
  } catch (error) {
    console.error('Error testing AI:', error);
    res.status(500).send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AI Test Error</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
    }
    .error {
      background: #f8d7da;
      color: #721c24;
      padding: 20px;
      border-radius: 5px;
      border-left: 4px solid #dc3545;
    }
    pre {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <h1>❌ AI Test Failed</h1>
  <div class="error">
    <strong>Error:</strong> ${error.message}
  </div>
  <h3>Details:</h3>
  <pre>${JSON.stringify(error, null, 2)}</pre>
  <p>Check that ANTHROPIC_API_KEY is set correctly in Vercel environment variables.</p>
</body>
</html>
    `);
  }
};
