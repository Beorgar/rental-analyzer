/**
 * Minimal Report Generation - GPT-4 Only
 * No external premium dependencies required
 */

require('dotenv').config();
const ApifyClient = require('apify-client').ApifyClient;
const axios = require('axios');
const { Resend } = require('resend');
const OpenAI = require('openai');

const BOOKING_URL = 'https://www.booking.com/hotel/at/paul-39-s-studio.ru.html';
const EMAIL = 'pavel.zubkov@gmail.com';

async function main() {
  console.log('🚀 Starting report generation (GPT-4)...');
  console.log(`📍 Property: ${BOOKING_URL}`);
  console.log(`📧 Email: ${EMAIL}\n`);

  try {
    // Step 1: Scrape property data
    console.log('1️⃣ Scraping property data from Booking.com...');
    const propertyData = await scrapePropertyData(BOOKING_URL);
    console.log(`✓ Property scraped: ${propertyData.title}`);
    console.log(`  Location: ${propertyData.location.city}, ${propertyData.location.country}`);
    console.log(`  Price: €${propertyData.pricing.basePrice}/night\n`);

    // Step 2: Generate pricing analysis with GPT-4
    console.log('2️⃣ Generating pricing analysis with GPT-4...');
    const analysis = await generateAnalysis(propertyData);
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
    console.log(`   • Model: GPT-4`);
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

  console.log('  → Starting Apify scraper (this may take 1-2 minutes)...');

  const input = {
    startUrls: [{ url }],
    maxOffers: 1,
    propertyType: 'none',
    includeReviews: false,
    language: 'en',
    currency: 'EUR'
  };

  const run = await apifyClient.actor('voyager/booking-scraper').call(input);
  const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

  if (!items || items.length === 0) {
    throw new Error('No property data found from Booking.com');
  }

  const property = items[0];

  return {
    url: property.url,
    title: property.name,
    location: {
      city: property.location?.address?.addressLocality || 'Unknown',
      country: property.location?.address?.addressCountry || 'Unknown',
      address: property.location?.address?.streetAddress || ''
    },
    pricing: {
      basePrice: property.price || 0,
      currency: 'EUR'
    },
    rating: {
      average: property.rating?.value || 0,
      reviewCount: property.rating?.reviewCount || 0
    },
    capacity: {
      guests: property.capacity || 2,
      bedrooms: property.bedrooms || 1
    },
    images: property.images?.slice(0, 5) || []
  };
}

async function generateAnalysis(propertyData) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const currentDate = new Date();
  const months = [];
  for (let i = 0; i < 3; i++) {
    const date = new Date(currentDate);
    date.setMonth(date.getMonth() + i);
    months.push(date.toLocaleString('en-US', { month: 'long' }));
  }

  const systemPrompt = 'You are an expert pricing analyst for short-term rental properties in Austria. Return ONLY valid JSON, no markdown, no explanations.';

  const prompt = `Analyze this rental property in ${propertyData.location.city}, ${propertyData.location.country}.

PROPERTY DATA:
- Name: ${propertyData.title}
- Location: ${propertyData.location.city}, ${propertyData.location.country}
- Current Price: €${propertyData.pricing.basePrice}/night
- Rating: ${propertyData.rating.average}/10 (${propertyData.rating.reviewCount} reviews)
- Capacity: ${propertyData.capacity.guests} guests, ${propertyData.capacity.bedrooms} bedrooms

TASK:
Create a detailed quarterly pricing strategy for NEXT 3 MONTHS: ${months.join(', ')}.

Focus on:
- Austrian tourism patterns (German, Swiss, Dutch, Italian tourists)
- Ski season timing (if applicable)
- Summer tourism season
- School holiday periods (German, Austrian, Swiss)
- Specific events and attractions in ${propertyData.location.city}

OUTPUT FORMAT (JSON):
{
  "tourismInsights": {
    "regionType": "Specific tourism type for this location",
    "peakSeason": "Detailed seasonality with specific months",
    "mainAttractions": "Top 3 real attractions in ${propertyData.location.city}",
    "targetAudience": "Demographic profile"
  },
  "monthlyPricing": [
    {
      "month": "Month name",
      "recommendedPrice": 100,
      "occupancy": "85%",
      "notes": "Specific reasons for this price this month"
    }
  ],
  "averagePrice": 100,
  "recommendations": [
    "5 actionable recommendations"
  ]
}

REQUIREMENTS:
- Exactly 3 months starting with ${months[0]}
- Prices in EUR, range: 50-150% of base (${propertyData.pricing.basePrice})
- BE SPECIFIC with real location/attraction/event names
- Consider Austrian tourism patterns`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 3000
  });

  return JSON.parse(response.choices[0].message.content);
}

function generateHTML(propertyData, analysis) {
  const date = new Date().toLocaleDateString('ru-RU');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Pricing Report - ${propertyData.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #003580; padding-bottom: 20px; }
    .header h1 { color: #003580; font-size: 28px; margin-bottom: 10px; }
    .header .date { color: #666; font-size: 14px; }
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
      <h1>📊 Ценовой анализ короткой аренды</h1>
      <p class="date">Отчёт от ${date}</p>
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
      <p>🤖 Отчёт создан с помощью GPT-4</p>
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
    subject: `✅ Ваш отчёт готов: ${propertyData.title}`,
    html: `
      <h2>Ваш ценовой анализ готов!</h2>
      <p>Объект: <strong>${propertyData.title}</strong></p>
      <p>Локация: ${propertyData.location.city}, ${propertyData.location.country}</p>

      <h3>Что включено в отчёт:</h3>
      <ul>
        <li>Детальный анализ региона и туристических потоков</li>
        <li>Рекомендации по ценам на следующие 3 месяца</li>
        <li>Анализ сезонности для вашей локации</li>
        <li>Конкретные стратегии максимизации дохода</li>
      </ul>

      <p>PDF отчёт прикреплён к письму.</p>
      <br>
      <p><em>С уважением,<br>Команда Rental Analyzer</em></p>
    `,
    attachments: [{
      filename: `rental-report-${Date.now()}.pdf`,
      content: pdfBuffer
    }]
  });
}

main();
