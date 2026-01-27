const OpenAI = require('openai');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { generateReportHTML } = require('../lib/generateHTML');
const { generatePDF } = require('../lib/generatePDF');
const { sendReportEmail } = require('../lib/sendEmail');
const { researchLocation, formatResearchSummary } = require('../lib/locationResearch');
const { getOrFetchResearch } = require('../lib/locationCache');
const { getCouncilAnalysis } = require('../lib/llmCouncil');

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
 * Generate pricing analysis using LLM Council with real tourism data
 * Combines multiple AI models for consensus and uses Tavily Search for real-time data
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

  // Step 1: Get or fetch tourism research data with caching
  console.log('🔍 Fetching tourism research data...');
  let tourismResearch = null;
  let researchSummary = '';

  try {
    tourismResearch = await getOrFetchResearch(
      propertyData.location.city,
      propertyData.location.country,
      researchLocation
    );

    if (tourismResearch) {
      researchSummary = formatResearchSummary(tourismResearch);
      console.log('✓ Tourism research data available');
    } else {
      console.log('⚠️  No tourism research data available, using AI knowledge only');
    }
  } catch (error) {
    console.error('⚠️  Tourism research failed:', error.message);
    researchSummary = '';
  }

  // Step 2: Build enhanced prompt with real tourism data
  const systemPrompt = 'You are an expert pricing analyst and tourism consultant for short-term rental properties. Return ONLY valid JSON, no markdown, no explanations.';

  const prompt = `You are analyzing a rental property with access to real tourism research data.

PROPERTY DATA:
- Name: ${propertyData.title}
- Location: ${propertyData.location.city}, ${propertyData.location.country}
- Current Price: ${propertyData.pricing.currency === 'EUR' ? '€' : '$'}${propertyData.pricing.basePrice}/night
- Rating: ${propertyData.rating.average}/10 (${propertyData.rating.reviewCount} reviews)
- Capacity: ${propertyData.capacity.guests} guests, ${propertyData.capacity.bedrooms} bedrooms
- Platform: Booking.com

${researchSummary ? `REAL TOURISM RESEARCH DATA:
${researchSummary}

USE THIS DATA to inform your analysis. This is real, current information about the location.
` : ''}

TASK:
Create a DETAILED quarterly pricing strategy for the NEXT 3 MONTHS: ${months.join(', ')}.
This is a PREMIUM €10 report - provide deep, actionable insights.

ANALYSIS FRAMEWORK:

1. REGIONAL TOURISM ANALYSIS for ${propertyData.location.city}:
   - Tourism type & seasonality (ski, beach, culture, business, events)
   - Peak vs off-season patterns${researchSummary ? ' - USE THE RESEARCH DATA ABOVE' : ''}
   - School holiday periods impact (German, Austrian, Swiss, Dutch tourists)
   - Weather and seasonal factors

2. LOCAL EVENTS & ATTRACTIONS:
   - Specific events during ${months.join(', ')} in ${propertyData.location.city}${researchSummary ? ' - REFER TO RESEARCH DATA' : ''}
   - Major attractions and their impact on pricing
   - Distance to key points of interest
   - Conferences, festivals, sports events

3. TOURIST DEMOGRAPHICS:
   - Who visits ${propertyData.location.city}? (families, couples, business, groups)
   - International vs domestic split
   - Typical length of stay
   - Booking patterns

4. COMPETITIVE POSITIONING:
   - Rating ${propertyData.rating.average}/10 impact on pricing
   - Market position for ${propertyData.capacity.guests} guests
   - Premium (9.0+): +15-25% | Good (8.0-8.9): +5-10% | Average (<8.0): competitive

5. PRICING & REVENUE STRATEGY:
   - High season: +25-40% | Shoulder: +10-20% | Low: -10-20%
   - Special events: +30-50%
   - Weekend vs weekday adjustments
   - Target occupancy: High 85-95%, Low 65-75%

OUTPUT FORMAT (JSON):
{
  "tourismInsights": {
    "regionType": "Specific tourism classification",
    "peakSeason": "Detailed seasonality explanation with months",
    "mainAttractions": "Top 3 specific attractions/reasons to visit",
    "targetAudience": "Detailed demographic profile"
  },
  "monthlyPricing": [
    {
      "month": "Month name",
      "recommendedPrice": 100,
      "occupancy": "85%",
      "notes": "SPECIFIC insights: mention actual events, attractions, tourist patterns for THIS month in THIS city"
    }
  ],
  "averagePrice": 100,
  "recommendations": [
    "5 specific, actionable recommendations with concrete numbers and local context"
  ]
}

CRITICAL REQUIREMENTS:
- Return exactly 3 months starting with ${currentMonth}
- All prices in ${propertyData.pricing.currency}
- Price range: 50% to 150% of base (${propertyData.pricing.basePrice})
- BE SPECIFIC: Use real location names, event names, attraction names
- Each month's notes must mention specific reasons for that price${researchSummary ? '\n- USE THE TOURISM RESEARCH DATA PROVIDED ABOVE' : ''}
- Recommendations must be actionable with exact steps`;

  try {
    // Step 3: Check if LLM Council is enabled (requires multiple API keys)
    const useCouncil = process.env.USE_LLM_COUNCIL === 'true' &&
                       (process.env.ANTHROPIC_API_KEY || process.env.GOOGLE_AI_API_KEY);

    let analysis;

    if (useCouncil) {
      // Use LLM Council for multi-model consensus
      console.log('🏛️  Using LLM Council for analysis...');
      analysis = await getCouncilAnalysis(prompt, systemPrompt, propertyData);
    } else {
      // Fallback to single model (GPT-4 or GPT-4o-mini based on env)
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      console.log(`🤖 Using ${model} for analysis...`);

      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 3000
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      analysis = JSON.parse(content);

      console.log(`✓ ${model} analysis complete. Tokens:`, response.usage?.total_tokens || 'N/A');
    }

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

    // Add research metadata to analysis
    if (tourismResearch) {
      analysis._researchMetadata = {
        hasRealData: true,
        researchDate: tourismResearch.timestamp
      };
    }

    return analysis;

  } catch (error) {
    console.error('❌ AI analysis failed:', error);
    console.log('→ Using fallback pricing calculation...');
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
