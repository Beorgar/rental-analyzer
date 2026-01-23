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
    // Demo property data for testing
    const propertyData = {
      title: 'Beautiful Apartment in City Center',
      location: {
        city: 'New York',
        country: 'USA',
      },
      capacity: {
        bedrooms: 2,
        guests: 4,
      },
      pricing: {
        basePrice: 150,
      },
      rating: {
        average: 4.8,
        reviewCount: 127,
      },
      amenities: ['WiFi', 'Kitchen', 'Air conditioning', 'Heating', 'TV', 'Washer', 'Parking'],
    };

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
