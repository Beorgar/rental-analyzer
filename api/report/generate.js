const OpenAI = require('openai');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { generateReportHTML } = require('../lib/generateHTML');
const { generatePDF } = require('../lib/generatePDF');
const { sendReportEmail } = require('../lib/sendEmail');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

    console.log('Starting report generation for:', propertyData.title);

    // Verify payment
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    console.log('✓ Payment verified');

    // Generate AI pricing analysis
    const analysis = await generatePricingAnalysis(propertyData);

    console.log('✓ AI analysis completed');

    // Generate HTML report
    const reportHTML = generateReportHTML({
      propertyData,
      analysis
    });

    console.log('✓ HTML report generated');

    // Generate PDF from HTML
    const pdfBuffer = await generatePDF(reportHTML);

    console.log('✓ PDF generated:', pdfBuffer.length, 'bytes');

    // Send email with PDF attachment
    await sendReportEmail({
      to: email,
      propertyName: propertyData.title,
      location: `${propertyData.location.city}, ${propertyData.location.country}`,
      pdfBuffer
    });

    console.log('✓ Email sent to:', email);

    res.status(200).json({
      success: true,
      message: 'Report has been sent to your email',
      data: {
        propertyName: propertyData.title,
        averagePrice: analysis.averagePrice,
        emailSent: true
      }
    });

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      error: 'Failed to generate report',
      details: error.message
    });
  }
};

/**
 * Generate pricing analysis using OpenAI GPT-4o-mini
 * Much cheaper than Claude: $0.15/1M tokens vs $3/1M tokens
 */
async function generatePricingAnalysis(propertyData) {
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('en-US', { month: 'long' });

  // Generate next 3 months (quarterly report)
  const months = [];
  for (let i = 0; i < 3; i++) {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() + i);
    months.push(date.toLocaleString('en-US', { month: 'long' }));
  }

  const prompt = `You are an expert pricing analyst and tourism consultant for short-term rental properties.

PROPERTY DATA:
- Name: ${propertyData.title}
- Location: ${propertyData.location.city}, ${propertyData.location.country}
- Current Price: ${propertyData.pricing.currency === 'EUR' ? '€' : '$'}${propertyData.pricing.basePrice}/night
- Rating: ${propertyData.rating.average}/10 (${propertyData.rating.reviewCount} reviews)
- Capacity: ${propertyData.capacity.guests} guests, ${propertyData.capacity.bedrooms} bedrooms
- Platform: Booking.com

TASK:
Create a DETAILED quarterly pricing strategy for the NEXT 3 MONTHS: ${months.join(', ')}.
This is a PREMIUM report - provide deep insights based on local tourism data.

DEEP ANALYSIS FRAMEWORK:

1. REGIONAL TOURISM ANALYSIS for ${propertyData.location.city}, ${propertyData.location.country}:

   A) Tourism Type & Seasonality:
   - What type of tourism dominates? (ski, beach, city/culture, business, events)
   - Peak season vs off-season patterns for this specific region
   - Weather impact on demand
   - School holiday periods (local and international)

   B) Local Events & Attractions:
   - Major events, festivals, conferences in ${propertyData.location.city} during these 3 months
   - Nearby attractions (ski resorts, beaches, museums, landmarks)
   - Distance to key points of interest
   - Sports events, concerts, trade shows

   C) Tourist Demographics:
   - Who visits ${propertyData.location.city}? (families, couples, business travelers, groups)
   - International vs domestic tourists
   - Average length of stay
   - Booking patterns (last-minute vs advance)

2. COMPETITIVE LANDSCAPE:
   - Market positioning based on rating ${propertyData.rating.average}/10
   - Price competitiveness for ${propertyData.capacity.guests} guests in ${propertyData.location.city}
   - Premium properties (9.0+): charge 15-25% more
   - Good properties (8.0-8.9): charge 5-10% more
   - Average properties (<8.0): stay competitive

3. PRICING STRATEGY:
   - High season: +25-40% (peak tourism months)
   - Shoulder season: +10-20% (moderate demand)
   - Low season: -10-20% (maintain occupancy)
   - Weekend vs weekday adjustments
   - Special events: +30-50%

4. OCCUPANCY & REVENUE OPTIMIZATION:
   - Target occupancy: High season 85-95%, Low season 65-75%
   - Revenue management: balance price vs occupancy
   - Length of stay discounts consideration
   - Early booking incentives

OUTPUT REQUIREMENTS:
Return ONLY valid JSON. Include tourism insights in the notes field.

{
  "tourismInsights": {
    "regionType": "Description of tourism type (e.g., 'Alpine ski resort town')",
    "peakSeason": "When and why (e.g., 'December-March for skiing')",
    "mainAttractions": "Top 3 nearby attractions/reasons tourists visit",
    "targetAudience": "Who books here (e.g., 'Families and ski enthusiasts')"
  },
  "monthlyPricing": [
    {
      "month": "January",
      "recommendedPrice": 95,
      "occupancy": "85%",
      "notes": "Peak ski season - Kitzsteinhorn Glacier nearby. High demand from European tourists. Recommend dynamic pricing for weekends (+15%)."
    }
  ],
  "averagePrice": 100,
  "recommendations": [
    "Specific, actionable recommendation based on local tourism (mention specific events/attractions)",
    "Pricing strategy recommendation with exact numbers",
    "Marketing/positioning recommendation for target audience",
    "Seasonality-based tip with timing",
    "Competition-based insight"
  ]
}

IMPORTANT:
- Return exactly 3 months of pricing (starting with ${currentMonth})
- All prices in ${propertyData.pricing.currency}
- Be SPECIFIC about ${propertyData.location.city} - use real local knowledge
- Mention specific attractions, events, or patterns for this location
- Recommendations must be actionable with concrete steps
- Price range: 50% to 150% of base price (${propertyData.pricing.basePrice})`;

  try {
    console.log('Calling OpenAI GPT-4o-mini...');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a pricing analyst. Return ONLY valid JSON, no markdown, no explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content;

    if (!content) {
      throw new Error('Empty response from OpenAI');
    }

    const analysis = JSON.parse(content);

    // Validation
    if (!analysis.monthlyPricing || !Array.isArray(analysis.monthlyPricing)) {
      throw new Error('Invalid analysis format: missing monthlyPricing array');
    }

    if (analysis.monthlyPricing.length !== 3) {
      throw new Error(`Invalid analysis format: expected 3 months, got ${analysis.monthlyPricing.length}`);
    }

    if (!analysis.averagePrice || analysis.averagePrice < 10 || analysis.averagePrice > 5000) {
      throw new Error(`Unrealistic average price: ${analysis.averagePrice}`);
    }

    if (!analysis.recommendations || !Array.isArray(analysis.recommendations)) {
      analysis.recommendations = [
        'Примените помесячные рекомендации по ценам',
        'Добавьте профессиональные фотографии',
        'Улучшите описание объекта'
      ];
    }

    console.log('✓ OpenAI analysis successful. Tokens:', response.usage?.total_tokens || 'N/A');
    console.log(`  Input: ${response.usage?.prompt_tokens || 'N/A'}, Output: ${response.usage?.completion_tokens || 'N/A'}`);

    return analysis;

  } catch (error) {
    console.error('OpenAI analysis failed:', error);

    // Fallback to basic calculation
    console.log('Using fallback pricing calculation...');
    return generateBasicPricing(propertyData, months);
  }
}

/**
 * Fallback pricing calculation if AI fails
 */
function generateBasicPricing(propertyData, months) {
  const basePrice = propertyData.pricing.basePrice;
  const rating = propertyData.rating.average;
  const ratingBonus = rating >= 9 ? 1.15 : rating >= 8 ? 1.05 : 1.0;

  // Simple seasonal pattern
  const seasonalPatterns = {
    'January': { multiplier: 1.1, occupancy: '70%', notes: 'Winter season' },
    'February': { multiplier: 1.0, occupancy: '65%', notes: 'Low season' },
    'March': { multiplier: 0.9, occupancy: '65%', notes: 'Spring starts' },
    'April': { multiplier: 1.0, occupancy: '75%', notes: 'Spring peak' },
    'May': { multiplier: 1.15, occupancy: '80%', notes: 'Pre-summer' },
    'June': { multiplier: 1.3, occupancy: '85%', notes: 'Summer begins' },
    'July': { multiplier: 1.35, occupancy: '90%', notes: 'High summer season' },
    'August': { multiplier: 1.3, occupancy: '88%', notes: 'Peak season' },
    'September': { multiplier: 1.1, occupancy: '75%', notes: 'Fall season' },
    'October': { multiplier: 0.95, occupancy: '70%', notes: 'Low season' },
    'November': { multiplier: 0.9, occupancy: '65%', notes: 'Off season' },
    'December': { multiplier: 1.2, occupancy: '80%', notes: 'Holiday season' }
  };

  const monthlyPricing = months.map(month => {
    const pattern = seasonalPatterns[month] || { multiplier: 1.0, occupancy: '70%', notes: 'Standard season' };
    const price = Math.round((basePrice * pattern.multiplier * ratingBonus) / 5) * 5;

    return {
      month,
      recommendedPrice: price,
      occupancy: pattern.occupancy,
      notes: pattern.notes
    };
  });

  const averagePrice = Math.round(
    monthlyPricing.reduce((sum, m) => sum + m.recommendedPrice, 0) / monthlyPricing.length
  );

  return {
    monthlyPricing,
    averagePrice,
    recommendations: [
      '⚠️ AI анализ временно недоступен - используется базовый расчёт',
      'Примените помесячные рекомендации по ценам',
      'Следите за локальными событиями и корректируйте цены',
      'Добавьте профессиональные фотографии для увеличения бронирований',
      'Улучшите описание объекта с акцентом на уникальные преимущества'
    ]
  };
}
