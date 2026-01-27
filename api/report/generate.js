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
    const { propertyData, email, paymentIntentId, selectedUpsells } = req.body;

    console.log('Starting report generation for:', propertyData.title);
    console.log('Selected upsells:', selectedUpsells);

    // Verify payment and get metadata
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Get upsells from payment metadata if not in request body
    const hasPhotosUpsell = selectedUpsells?.photos || paymentIntent.metadata?.hasPhotosUpsell === 'true';
    const hasDescriptionUpsell = selectedUpsells?.description || paymentIntent.metadata?.hasDescriptionUpsell === 'true';

    console.log('✓ Payment verified');
    console.log(`  Photos upsell: ${hasPhotosUpsell}`);
    console.log(`  Description upsell: ${hasDescriptionUpsell}`);

    // Generate enhanced description if upsell selected
    let enhancedDescription = null;
    if (hasDescriptionUpsell && propertyData.description) {
      console.log('Generating enhanced description...');
      enhancedDescription = await generateEnhancedDescription(propertyData);
      console.log('✓ Enhanced description generated');
    }

    // Generate photo analysis if upsell selected
    let photoAnalysis = null;
    if (hasPhotosUpsell && propertyData.images && propertyData.images.length > 0) {
      console.log('Analyzing photos...');
      photoAnalysis = await analyzePhotos(propertyData);
      console.log('✓ Photo analysis completed');
    }

    // Generate AI pricing analysis
    const analysis = await generatePricingAnalysis(propertyData);

    console.log('✓ AI analysis completed');

    // Generate HTML report with upsells
    const reportHTML = generateReportHTML({
      propertyData,
      analysis,
      enhancedDescription,
      photoAnalysis,
      hasPhotosUpsell,
      hasDescriptionUpsell
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

  // Step 2: Calculate days in each month for daily pricing
  const monthDetails = [];
  for (let i = 0; i < 3; i++) {
    const monthDate = new Date(currentDate);
    monthDate.setMonth(monthDate.getMonth() + i);
    const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
    monthDetails.push({
      month: months[i],
      year: monthDate.getFullYear(),
      monthIndex: monthDate.getMonth() + 1,
      daysInMonth
    });
  }

  // Step 3: Build enhanced prompt with real tourism data and daily pricing
  const systemPrompt = 'You are an expert pricing analyst and tourism consultant for short-term rental properties in Austria. Return ONLY valid JSON, no markdown, no explanations.';

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

SCHOOL HOLIDAYS 2026 (KEY MARKETS FOR AUSTRIAN TOURISM):
Germany (varies by state):
- Winter holidays: Feb 2-16 (most states)
- Easter holidays: Mar 30 - Apr 13
- Pentecost: May 18-30

Switzerland:
- Winter holidays: Jan 31 - Feb 15
- Spring holidays: Apr 11-26

Netherlands:
- Winter holidays: Feb 21 - Mar 1
- May holiday: Apr 25 - May 10

Austria:
- Winter semester break: Feb 7-15
- Easter holidays: Mar 28 - Apr 7

TASK:
Create a DETAILED DAY-BY-DAY pricing strategy for the NEXT 3 MONTHS: ${months.join(', ')}.
This is a PREMIUM report - provide a recommended price for EVERY SINGLE DAY with reasoning.

ANALYSIS FRAMEWORK:

1. REGIONAL TOURISM ANALYSIS for ${propertyData.location.city}:
   - Tourism type & seasonality (ski, beach, culture, business, events)
   - Peak vs off-season patterns${researchSummary ? ' - USE THE RESEARCH DATA ABOVE' : ''}
   - School holiday impact from Germany, Switzerland, Netherlands, Austria
   - Weather and seasonal factors

2. LOCAL EVENTS & ATTRACTIONS:
   - Specific events during ${months.join(', ')} in ${propertyData.location.city}${researchSummary ? ' - REFER TO RESEARCH DATA' : ''}
   - Major attractions and their impact on pricing
   - Conferences, festivals, sports events
   - Ski season timing (if applicable)

3. DAY-BY-DAY PRICING RULES:
   - School holidays (above dates): +30-50% (peak demand from families)
   - Weekends (Fri-Sun): +20-35% vs weekdays
   - Major holidays/events: +40-70%
   - Weekdays (Mon-Thu) off-season: base or -10-15%
   - Consider day of week + season + events for EACH day

OUTPUT FORMAT (JSON):
{
  "tourismInsights": {
    "regionType": "Specific tourism classification",
    "peakSeason": "Detailed seasonality with months and school holiday impact",
    "mainAttractions": "Top 3 specific attractions",
    "targetAudience": "Detailed demographic profile",
    "schoolHolidaysImpact": "How German/Swiss/Dutch/Austrian school holidays affect demand"
  },
  "monthlyPricing": [
    {
      "month": "${monthDetails[0].month}",
      "year": ${monthDetails[0].year},
      "monthSummary": "Brief overview of this month's pricing strategy and key events/holidays",
      "dailyPrices": [
        {"day": 1, "date": "${monthDetails[0].year}-${String(monthDetails[0].monthIndex).padStart(2, '0')}-01", "dayOfWeek": "Day name", "price": 100, "reason": "Specific reason (5-15 words)"},
        {"day": 2, "date": "${monthDetails[0].year}-${String(monthDetails[0].monthIndex).padStart(2, '0')}-02", "dayOfWeek": "Day name", "price": 105, "reason": "Specific reason"}
        // ... continue for all ${monthDetails[0].daysInMonth} days
      ]
    },
    {
      "month": "${monthDetails[1].month}",
      "year": ${monthDetails[1].year},
      "monthSummary": "Overview for month 2",
      "dailyPrices": [
        // ... all ${monthDetails[1].daysInMonth} days
      ]
    },
    {
      "month": "${monthDetails[2].month}",
      "year": ${monthDetails[2].year},
      "monthSummary": "Overview for month 3",
      "dailyPrices": [
        // ... all ${monthDetails[2].daysInMonth} days
      ]
    }
  ],
  "averagePrice": 110,
  "recommendations": [
    "5 specific, actionable recommendations with concrete numbers and local context"
  ]
}

CRITICAL REQUIREMENTS:
- Return exactly 3 months starting with ${currentMonth}
- Each month must have dailyPrices array with EVERY SINGLE DAY
- Month 1: ${monthDetails[0].daysInMonth} days, Month 2: ${monthDetails[1].daysInMonth} days, Month 3: ${monthDetails[2].daysInMonth} days
- All prices in ${propertyData.pricing.currency}
- Price range: 50% to 150% of base (${propertyData.pricing.basePrice})
- HIGHER prices on: weekends, school holidays, events, peak season
- LOWER prices on: weekdays in off-season
- Each day must have price + short reason mentioning why (weekend/holiday/event/weekday)
- Include schoolHolidaysImpact in tourismInsights explaining German/Swiss/Dutch/Austrian holiday periods
${researchSummary ? '- USE THE TOURISM RESEARCH DATA for specific event dates' : ''}
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

/**
 * Generate enhanced marketing description for property (€15 upsell)
 */
async function generateEnhancedDescription(propertyData) {
  try {
    const prompt = `Create a compelling marketing description for this rental property:

Property: ${propertyData.title}
Location: ${propertyData.location.city}, ${propertyData.location.country}
Current description: ${propertyData.description || 'None'}
Rating: ${propertyData.rating.average}/10
Capacity: ${propertyData.capacity.guests} guests, ${propertyData.capacity.bedrooms} bedrooms

Task: Write a professional, compelling marketing description (150-250 words) that:
1. Highlights unique selling points
2. Describes location benefits and nearby attractions
3. Creates emotional connection with potential guests
4. Emphasizes value and experience
5. Uses persuasive language without sounding salesy

Write in Russian (informal, friendly tone using "вы").
Focus on experiences and benefits, not just features.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert copywriter for luxury vacation rentals. Write compelling, authentic descriptions that convert browsers into bookers.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Enhanced description generation failed:', error);
    return null;
  }
}

/**
 * Analyze property photos and provide recommendations (€50 upsell)
 */
async function analyzePhotos(propertyData) {
  if (!propertyData.images || propertyData.images.length === 0) {
    return null;
  }

  try {
    const photoCount = propertyData.images.length;
    const prompt = `Analyze ${photoCount} property photos for a rental listing:

Property: ${propertyData.title}
Location: ${propertyData.location.city}, ${propertyData.location.country}
Photo URLs available: ${photoCount}

Based on typical vacation rental photography standards, provide:

1. Overall photo quality assessment (1-10 scale)
2. What's working well (2-3 points)
3. Missing photo types (e.g., kitchen detail, bathroom, outdoor areas, local attractions)
4. Specific improvement recommendations (4-5 actionable points)
5. Photo sequence/order recommendations

Return JSON format:
{
  "overallScore": 7,
  "strengths": ["list of strengths"],
  "missing": ["list of missing photo types"],
  "recommendations": ["list of specific improvements"],
  "sequenceAdvice": "advice on photo order"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional vacation rental photographer and marketing consultant. Provide actionable, specific advice.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 800
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Photo analysis failed:', error);
    return null;
  }
}
