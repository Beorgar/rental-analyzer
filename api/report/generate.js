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

  // Generate next 6 months
  const months = [];
  for (let i = 0; i < 6; i++) {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() + i);
    months.push(date.toLocaleString('en-US', { month: 'long' }));
  }

  const prompt = `You are an expert pricing analyst for short-term rental properties on Booking.com.

PROPERTY DATA:
- Name: ${propertyData.title}
- Location: ${propertyData.location.city}, ${propertyData.location.country}
- Current Price: ${propertyData.pricing.currency === 'EUR' ? '€' : '$'}${propertyData.pricing.basePrice}/night
- Rating: ${propertyData.rating.average}/10 (${propertyData.rating.reviewCount} reviews)
- Capacity: ${propertyData.capacity.guests} guests, ${propertyData.capacity.bedrooms} bedrooms
- Platform: Booking.com

TASK:
Calculate optimal pricing strategy for the NEXT 6 MONTHS: ${months.join(', ')}.

ANALYSIS FRAMEWORK:

1. SEASONALITY for ${propertyData.location.city}, ${propertyData.location.country}:
   - High season months (adjust +25-35% above base)
   - Medium season months (adjust +10-15% above base)
   - Low season months (adjust -10-15% below base)
   - Consider local tourism patterns, ski season, summer holidays, etc.

2. RATING ADJUSTMENT:
   - Rating ≥ 9.0: Premium property → +15%
   - Rating 8.0-8.9: Good property → +5%
   - Rating < 8.0: Average property → 0%

3. OCCUPANCY ESTIMATES:
   - High season: 85-90%
   - Medium season: 70-80%
   - Low season: 60-70%

CALCULATION RULES:
- Base calculations on current price: ${propertyData.pricing.basePrice}
- Apply seasonality multiplier first, then rating adjustment
- Round final prices to nearest 5
- Be realistic - avoid suggesting more than 50% price changes
- Consider ${propertyData.location.city} specific tourism trends

OUTPUT REQUIREMENTS:
Return ONLY valid JSON (no markdown, no explanations). Schema:

{
  "monthlyPricing": [
    {
      "month": "January",
      "recommendedPrice": 95,
      "occupancy": "70%",
      "notes": "Winter/ski season - medium demand"
    }
  ],
  "averagePrice": 100,
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2",
    "Specific actionable recommendation 3"
  ]
}

IMPORTANT:
- Return exactly 6 months of pricing (starting with ${currentMonth})
- All prices must be realistic (between 50% and 150% of base price)
- Recommendations must be specific and actionable
- Use ${propertyData.pricing.currency} currency`;

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

    if (analysis.monthlyPricing.length !== 6) {
      throw new Error(`Invalid analysis format: expected 6 months, got ${analysis.monthlyPricing.length}`);
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
