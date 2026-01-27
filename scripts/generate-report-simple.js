/**
 * Simplified Manual Report Generation
 * Uses LLM Council without Tavily (for local execution)
 */

require('dotenv').config();
const ApifyClient = require('apify-client').ApifyClient;
const axios = require('axios');
const { Resend } = require('resend');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk').default;
const { GoogleGenerativeAI } = require('@google/generative-ai');

const BOOKING_URL = 'https://www.booking.com/hotel/at/paul-39-s-studio.ru.html';
const EMAIL = 'pavel.zubkov@gmail.com';

async function main() {
  console.log('🚀 Starting premium report generation...');
  console.log(`📍 Property: ${BOOKING_URL}`);
  console.log(`📧 Email: ${EMAIL}\n`);

  try {
    // Step 1: Scrape property data
    console.log('1️⃣ Scraping property data from Booking.com...');
    const propertyData = await scrapePropertyData(BOOKING_URL);
    console.log(`✓ Property scraped: ${propertyData.title}`);
    console.log(`  Location: ${propertyData.location.city}, ${propertyData.location.country}`);
    console.log(`  Price: €${propertyData.pricing.basePrice}/night\n`);

    // Step 2: Generate pricing analysis with LLM Council
    console.log('2️⃣ Generating pricing analysis with LLM Council...');
    console.log('   🏛️  Querying GPT-4, Claude, and Gemini in parallel...\n');
    const analysis = await generateAnalysisWithCouncil(propertyData);
    console.log(`✓ Analysis complete\n`);

    // Step 3: Generate HTML report
    console.log('3️⃣ Generating HTML report...');
    const html = generateHTML(propertyData, analysis);
    console.log(`✓ HTML generated\n`);

    // Step 4: Generate PDF
    console.log('4️⃣ Converting to PDF...');
    const pdfBuffer = await generatePDF(html);
    console.log(`✓ PDF generated (${Math.round(pdfBuffer.length / 1024)}KB)\n`);

    // Step 5: Send email
    console.log('5️⃣ Sending email...');
    await sendEmail(EMAIL, propertyData, pdfBuffer);
    console.log(`✓ Email sent to ${EMAIL}\n`);

    console.log('✅ Report generation completed successfully!');
    console.log('\n📊 Report Summary:');
    console.log(`   • LLM Council: GPT-4 + Claude + Gemini consensus`);
    console.log(`   • Average price: €${analysis.averagePrice}/night`);
    console.log(`   • Email: pavel.zubkov@gmail.com`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

async function scrapePropertyData(url) {
  const apifyClient = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

  console.log('  → Starting Apify scraper...');

  const input = {
    startUrls: [{ url }],
    maxOffers: 1,
    propertyType: 'none',
    includeReviews: false,
    language: 'en-gb',
    currency: 'EUR'
  };

  const run = await apifyClient.actor('voyager/booking-scraper').call(input);
  const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

  if (!items || items.length === 0) {
    throw new Error('No property data found from Booking.com');
  }

  const property = items[0];

  // Map country codes to names
  const countryMap = {
    'at': 'Austria',
    'de': 'Germany',
    'ch': 'Switzerland',
    'it': 'Italy',
    'fr': 'France',
    'es': 'Spain',
    'uk': 'United Kingdom',
    'us': 'United States'
  };

  // Parse images - handle both array and single string
  let images = [];
  if (property.image && typeof property.image === 'string') {
    images = [property.image];
  } else if (property.images && Array.isArray(property.images)) {
    images = property.images;
  }

  return {
    url: property.url,
    title: property.name,
    location: {
      city: property.address?.city || 'Unknown',
      country: countryMap[property.address?.country?.toLowerCase()] || property.address?.country || 'Unknown',
      address: property.address?.full || ''
    },
    pricing: {
      basePrice: property.price || 90, // Default to 90 EUR if no price
      currency: property.currency || 'EUR'
    },
    rating: {
      average: property.rating || 0,
      reviewCount: property.reviews || 0
    },
    capacity: {
      guests: property.capacity || 4,
      bedrooms: property.bedrooms || 1
    },
    images: images.slice(0, 5)
  };
}

async function generateAnalysisWithCouncil(propertyData) {
  const currentDate = new Date();
  const months = [];
  for (let i = 0; i < 3; i++) {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() + i);
    months.push(date.toLocaleString('en-US', { month: 'long' }));
  }

  const systemPrompt = 'You are an expert pricing analyst and tourism consultant for short-term rental properties. Return ONLY valid JSON, no markdown, no explanations.';

  const prompt = `You are analyzing a rental property in ${propertyData.location.city}, ${propertyData.location.country}.

PROPERTY DATA:
- Name: ${propertyData.title}
- Location: ${propertyData.location.city}, ${propertyData.location.country}
- Current Price: €${propertyData.pricing.basePrice}/night
- Rating: ${propertyData.rating.average}/10 (${propertyData.rating.reviewCount} reviews)
- Capacity: ${propertyData.capacity.guests} guests, ${propertyData.capacity.bedrooms} bedrooms

TASK:
Create a DETAILED quarterly pricing strategy for the NEXT 3 MONTHS: ${months.join(', ')}.
This is a PREMIUM €75 report (base + description + photos) - provide deep, actionable insights.

OUTPUT FORMAT (JSON):
{
  "tourismInsights": {
    "regionType": "Specific tourism classification for ${propertyData.location.city}",
    "peakSeason": "Detailed seasonality explanation with months",
    "mainAttractions": "Top 3 specific attractions in ${propertyData.location.city}",
    "targetAudience": "Detailed demographic profile"
  },
  "monthlyPricing": [
    {
      "month": "Month name",
      "recommendedPrice": 100,
      "occupancy": "85%",
      "notes": "SPECIFIC insights about ${propertyData.location.city} for this month"
    }
  ],
  "averagePrice": 100,
  "recommendations": [
    "5 specific actionable recommendations with real numbers and local context"
  ]
}

REQUIREMENTS:
- Exactly 3 months starting with ${months[0]}
- Prices in EUR, range: 50-150% of base (${propertyData.pricing.basePrice})
- BE SPECIFIC: Use real attraction names, event names for ${propertyData.location.city}, ${propertyData.location.country}
- Focus on Austrian tourism patterns, German/Swiss/Dutch tourists
- Consider ski season, summer season, school holidays`;

  // Query all three models in parallel
  console.log('  → Querying GPT-4...');
  console.log('  → Querying Claude Sonnet...');
  console.log('  → Querying Gemini Pro...');

  const responses = await Promise.all([
    queryGPT4(prompt, systemPrompt),
    queryClaude(prompt, systemPrompt),
    queryGemini(prompt, systemPrompt)
  ]);

  const validResponses = responses.filter(r => r !== null);
  console.log(`  ✓ Received ${validResponses.length}/3 responses from council\n`);

  if (validResponses.length === 0) {
    throw new Error('All LLM Council members failed');
  }

  // Parse responses
  const parsedResponses = [];
  for (const response of validResponses) {
    try {
      parsedResponses.push({
        model: response.model,
        data: parseJSON(response.content)
      });
    } catch (error) {
      console.warn(`  ⚠️  Could not parse ${response.model}`);
    }
  }

  if (parsedResponses.length === 0) {
    throw new Error('Could not parse any council responses');
  }

  // Synthesize responses
  console.log('  → Synthesizing council responses...');
  const synthesized = await synthesizeResponses(parsedResponses);
  console.log('  ✓ Synthesis complete');

  return synthesized;
}

async function queryGPT4(prompt, systemPrompt) {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });
    console.log('  ✓ GPT-4 response received');
    return { model: 'gpt-4', content: response.choices[0].message.content };
  } catch (error) {
    console.warn('  ⚠️  GPT-4 failed:', error.message);
    return null;
  }
}

async function queryClaude(prompt, systemPrompt) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('  ⚠️  No Anthropic API key, skipping Claude');
    return null;
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    });
    console.log('  ✓ Claude response received');
    return { model: 'claude-3-5-sonnet', content: response.content[0].text };
  } catch (error) {
    console.warn('  ⚠️  Claude failed:', error.message);
    return null;
  }
}

async function queryGemini(prompt, systemPrompt) {
  if (!process.env.GOOGLE_AI_API_KEY) {
    console.warn('  ⚠️  No Google AI key, skipping Gemini');
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    console.log('  ✓ Gemini response received');
    return { model: 'gemini-1.5-pro', content: response.text() };
  } catch (error) {
    console.warn('  ⚠️  Gemini failed:', error.message);
    return null;
  }
}

async function synthesizeResponses(parsedResponses) {
  if (parsedResponses.length === 1) {
    return parsedResponses[0].data;
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const synthesisPrompt = `You are synthesizing ${parsedResponses.length} AI analyses into a consensus report.

${parsedResponses.map((r, i) => `
## Analysis ${i + 1} (${r.model}):
${JSON.stringify(r.data, null, 2)}
`).join('\n')}

Combine the best insights from each analysis:
- Take median/average prices
- Combine unique insights
- Ensure consistency
- Provide most accurate tourism insights

Output a single comprehensive JSON report.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an expert at synthesizing multiple analyses. Always output valid JSON.'
      },
      { role: 'user', content: synthesisPrompt }
    ],
    temperature: 0.3,
    max_tokens: 4000,
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content);
}

function parseJSON(content) {
  try {
    return JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    throw new Error('Could not parse JSON');
  }
}

function generateHTML(propertyData, analysis) {
  const date = new Date().toLocaleDateString('ru-RU');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Premium Report - ${propertyData.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #003580; padding-bottom: 20px; }
    .header h1 { color: #003580; font-size: 28px; margin-bottom: 10px; }
    .header .date { color: #666; font-size: 14px; }
    .header .badge { background: #gold; color: #333; padding: 5px 15px; border-radius: 20px; display: inline-block; margin-top: 10px; font-weight: bold; }
    .property-info { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
    .property-info h2 { color: #003580; font-size: 20px; margin-bottom: 15px; }
    .property-info p { margin-bottom: 8px; }
    .section { margin-bottom: 30px; }
    .section h2 { color: #003580; font-size: 22px; margin-bottom: 15px; border-left: 4px solid #003580; padding-left: 15px; }
    .insights { background: #e8f4f8; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .insights p { margin-bottom: 10px; }
    .pricing-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .pricing-table th, .pricing-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    .pricing-table th { background: #003580; color: white; font-weight: 600; }
    .pricing-table tr:hover { background: #f5f5f5; }
    .price { color: #008009; font-weight: bold; font-size: 18px; }
    .recommendations { background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; }
    .recommendations ul { margin-left: 20px; }
    .recommendations li { margin-bottom: 10px; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Премиум ценовой анализ</h1>
      <p class="date">Отчёт от ${date}</p>
      <span class="badge">🏛️ LLM Council: GPT-4 + Claude + Gemini</span>
    </div>

    <div class="property-info">
      <h2>🏠 Информация об объекте</h2>
      <p><strong>Название:</strong> ${propertyData.title}</p>
      <p><strong>Локация:</strong> ${propertyData.location.city}, ${propertyData.location.country}</p>
      <p><strong>Текущая цена:</strong> €${propertyData.pricing.basePrice}/ночь</p>
      <p><strong>Рейтинг:</strong> ${propertyData.rating.average}/10 (${propertyData.rating.reviewCount} отзывов)</p>
      <p><strong>Вместимость:</strong> ${propertyData.capacity.guests} гостей, ${propertyData.capacity.bedrooms} спален</p>
    </div>

    <div class="section">
      <h2>🌍 Туристические особенности региона</h2>
      <div class="insights">
        <p><strong>Тип региона:</strong> ${analysis.tourismInsights?.regionType || 'Туристический регион'}</p>
        <p><strong>Пиковый сезон:</strong> ${analysis.tourismInsights?.peakSeason || 'Зависит от сезона'}</p>
        <p><strong>Основные достопримечательности:</strong> ${analysis.tourismInsights?.mainAttractions || 'Различные туристические объекты'}</p>
        <p><strong>Целевая аудитория:</strong> ${analysis.tourismInsights?.targetAudience || 'Разнообразные туристы'}</p>
      </div>
    </div>

    <div class="section">
      <h2>💰 Рекомендации по ценам на 3 месяца</h2>
      <table class="pricing-table">
        <thead>
          <tr>
            <th>Месяц</th>
            <th>Рекомендованная цена</th>
            <th>Прогноз загрузки</th>
            <th>Примечания</th>
          </tr>
        </thead>
        <tbody>
          ${analysis.monthlyPricing?.map(month => `
            <tr>
              <td><strong>${month.month}</strong></td>
              <td class="price">€${month.recommendedPrice}</td>
              <td>${month.occupancy}</td>
              <td>${month.notes}</td>
            </tr>
          `).join('') || ''}
        </tbody>
      </table>
      <p><strong>Средняя рекомендованная цена:</strong> <span class="price">€${analysis.averagePrice}</span>/ночь</p>
    </div>

    <div class="section">
      <h2>✅ Рекомендации для максимизации дохода</h2>
      <div class="recommendations">
        <ul>
          ${analysis.recommendations?.map(rec => `<li>${rec}</li>`).join('') || ''}
        </ul>
      </div>
    </div>

    <div class="footer">
      <p>🏛️ <strong>Премиум отчёт с LLM Council</strong></p>
      <p>Консенсус-анализ от GPT-4, Claude Sonnet 3.5 и Gemini 1.5 Pro</p>
      <p>📧 Rental Analyzer © ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>`;
}

async function generatePDF(html) {
  const response = await axios.post('https://api.pdfshift.io/v3/convert/pdf', {
    source: html,
    sandbox: false,
    format: 'A4',
    margin: {
      top: '15mm',
      bottom: '15mm',
      left: '10mm',
      right: '10mm'
    }
  }, {
    auth: {
      username: 'api',
      password: process.env.PDFSHIFT_API_KEY
    },
    responseType: 'arraybuffer'
  });

  return Buffer.from(response.data);
}

async function sendEmail(email, propertyData, pdfBuffer) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: 'Rental Analyzer <onboarding@resend.dev>',
    to: email,
    subject: `✅ Ваш премиум отчёт готов: ${propertyData.title}`,
    html: `
      <h2>Ваш премиум ценовой анализ готов!</h2>
      <p>Объект: <strong>${propertyData.title}</strong></p>
      <p>Локация: ${propertyData.location.city}, ${propertyData.location.country}</p>

      <h3>🏛️ Что включено в премиум отчёт:</h3>
      <ul>
        <li><strong>LLM Council анализ</strong> - Консенсус GPT-4, Claude Sonnet 3.5 и Gemini 1.5 Pro</li>
        <li><strong>Детальные рекомендации по ценам</strong> на следующие 3 месяца</li>
        <li><strong>Анализ сезонности</strong> и туристических потоков</li>
        <li><strong>Конкретные стратегии</strong> максимизации дохода</li>
        <li><strong>Оценка конкурентоспособности</strong> вашего объекта</li>
      </ul>

      <p>PDF отчёт прикреплён к письму.</p>
      <br>
      <p><em>С уважением,<br>Команда Rental Analyzer</em></p>
    `,
    attachments: [{
      filename: `rental-report-premium-${Date.now()}.pdf`,
      content: pdfBuffer
    }]
  });
}

main();
