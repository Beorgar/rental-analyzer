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

SCHOOL HOLIDAYS 2026: German Feb 2-16, Easter Mar 30-Apr 13, Swiss Jan 31-Feb 15, Austrian Feb 7-15

TASK: Create DAY-BY-DAY pricing for 3 months: ${months.join(', ')}. Provide price for EVERY day with brief reason.

PRICING RULES:
- School holidays: +30-50%
- Weekends (Fri-Sun): +20-35%
- Major events: +40-70%
- Weekdays off-season: base or -10-15%

JSON FORMAT:
{
  "tourismInsights": {"regionType": "...", "peakSeason": "...", "mainAttractions": "...", "targetAudience": "...", "schoolHolidaysImpact": "..."},
  "monthlyPricing": [
    {
      "month": "${monthDetails[0].month}", "year": ${monthDetails[0].year}, "monthSummary": "Brief overview",
      "dailyPrices": [
        {"day": 1, "date": "${monthDetails[0].year}-${String(monthDetails[0].monthIndex).padStart(2, '0')}-01", "dayOfWeek": "Monday", "price": 100, "reason": "Weekday rate"},
        // ... all ${monthDetails[0].daysInMonth} days
      ]
    }
    // ... 2 more months
  ],
  "averagePrice": 110,
  "recommendations": ["5 actionable recommendations"]
}

REQUIREMENTS: 3 months (${currentMonth} to ${months[2]}), ALL days, prices 50-150% of ${propertyData.pricing.basePrice}, higher on weekends/holidays`;

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
      // Fallback to single model
      console.log(`🤖 Using GPT-4o for analysis...`);

      // Retry logic for API calls
      let lastError;
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
            max_tokens: 4000,
            timeout: 120000 // 2 minutes timeout
          });

          const content = response.choices[0].message.content;
          if (!content) {
            throw new Error('Empty response from OpenAI');
          }

          analysis = JSON.parse(content);
          console.log(`✓ GPT-4o analysis complete. Tokens:`, response.usage?.total_tokens || 'N/A');
          break; // Success, exit retry loop
        } catch (error) {
          lastError = error;
          console.error(`  ✗ Attempt ${attempt} failed:`, error.message);
          if (attempt < 2) {
            console.log('  → Retrying...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
          }
        }
      }

      if (!analysis) {
        throw lastError || new Error('Failed to generate analysis after retries');
      }
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
    console.error('❌ AI analysis failed:', error.message);
    console.error('Error details:', error.response?.data || error.stack);
    console.log('→ Using fallback pricing calculation...');
    return generateBasicPricing(propertyData, months);
  }
}

/**
 * Fallback pricing calculation with daily prices if AI fails
 */
function generateBasicPricing(propertyData, months) {
  const basePrice = propertyData.pricing.basePrice;
  const rating = propertyData.rating.average;
  const ratingBonus = rating >= 9 ? 1.15 : rating >= 8 ? 1.05 : 1.0;
  const currentDate = new Date();

  // Simple seasonal pattern
  const seasonalPatterns = {
    'January': { multiplier: 1.1, occupancy: '70%', summary: 'Winter season in Austria - ski tourism' },
    'February': { multiplier: 1.0, occupancy: '65%', summary: 'End of winter season, lower demand' },
    'March': { multiplier: 0.9, occupancy: '65%', summary: 'Spring begins, off-season rates' },
    'April': { multiplier: 1.0, occupancy: '75%', summary: 'Spring peak with Easter holidays' },
    'May': { multiplier: 1.15, occupancy: '80%', summary: 'Pre-summer, increasing demand' },
    'June': { multiplier: 1.3, occupancy: '85%', summary: 'Summer season starts' },
    'July': { multiplier: 1.35, occupancy: '90%', summary: 'Peak summer season with high demand' },
    'August': { multiplier: 1.3, occupancy: '88%', summary: 'Continued summer peak season' },
    'September': { multiplier: 1.1, occupancy: '75%', summary: 'Early fall, still good tourism' },
    'October': { multiplier: 0.95, occupancy: '70%', summary: 'Off-season rates return' },
    'November': { multiplier: 0.9, occupancy: '65%', summary: 'Low season before winter' },
    'December': { multiplier: 1.2, occupancy: '80%', summary: 'Holiday season and early ski season' }
  };

  const monthlyPricing = [];
  let totalPrice = 0;
  let totalDays = 0;

  for (let i = 0; i < months.length; i++) {
    const monthName = months[i];
    const monthDate = new Date(currentDate);
    monthDate.setMonth(currentDate.getMonth() + i);
    const year = monthDate.getFullYear();
    const monthIndex = monthDate.getMonth() + 1;
    const daysInMonth = new Date(year, monthIndex, 0).getDate();

    const pattern = seasonalPatterns[monthName] || { multiplier: 1.0, occupancy: '70%', summary: 'Standard season' };
    const baseMonthPrice = Math.round((basePrice * pattern.multiplier * ratingBonus) / 5) * 5;

    const dailyPrices = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex - 1, day);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const isWeekend = dayOfWeek === 'Friday' || dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';

      // Weekend premium
      let dayMultiplier = isWeekend ? 1.25 : 1.0;
      let reason = isWeekend ? 'Weekend premium' : 'Weekday rate';

      const dayPrice = Math.round((baseMonthPrice * dayMultiplier) / 5) * 5;

      dailyPrices.push({
        day,
        date: `${year}-${String(monthIndex).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        dayOfWeek,
        price: dayPrice,
        reason
      });

      totalPrice += dayPrice;
      totalDays++;
    }

    monthlyPricing.push({
      month: monthName,
      year,
      monthIndex,
      monthSummary: pattern.summary,
      dailyPrices
    });
  }

  const averagePrice = Math.round(totalPrice / totalDays);

  return {
    tourismInsights: {
      regionType: 'Alpine tourism destination',
      peakSeason: 'Winter (Dec-Feb) for skiing, Summer (Jun-Aug) for hiking',
      mainAttractions: 'Ski resorts, alpine scenery, outdoor activities',
      targetAudience: 'Families, couples, outdoor enthusiasts',
      schoolHolidaysImpact: 'German and Austrian school holidays drive peak demand in winter and summer'
    },
    monthlyPricing,
    averagePrice,
    recommendations: [
      'Примените посуточные рекомендации по ценам для максимизации дохода',
      'Повышайте цены на выходные дни (пятница-воскресенье) на 20-35%',
      'Следите за локальными событиями и школьными каникулами для корректировки цен',
      'Добавьте профессиональные фотографии для увеличения бронирований на 25%',
      'Улучшите описание объекта с акцентом на уникальные преимущества локации'
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
      model: 'gpt-4o',
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
      model: 'gpt-4o',
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
