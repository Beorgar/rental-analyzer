/**
 * Test script to verify upsells work correctly
 */

require('dotenv').config();

// Mock property data with images and description
const propertyData = {
  id: 'test-property',
  url: 'https://www.booking.com/hotel/at/paul-39-s-studio.ru.html',
  title: "Paul's Studio",
  description: "Студия Paul's Studio расположена в городе Капрун. К услугам гостей номера с кондиционером и бесплатным Wi-Fi.",
  location: {
    city: 'Kaprun',
    country: 'Austria',
    address: 'Kaprun 123'
  },
  pricing: {
    basePrice: 90,
    currency: 'EUR'
  },
  rating: {
    average: 8.1,
    reviewCount: 78
  },
  capacity: {
    guests: 4,
    bedrooms: 1
  },
  images: [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
    'https://example.com/image4.jpg',
    'https://example.com/image5.jpg'
  ]
};

const selectedUpsells = {
  description: true,
  photos: true
};

async function testUpsells() {
  console.log('🧪 Testing upsells generation...\n');

  // Import the generate function
  const OpenAI = require('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Test 1: Enhanced Description
  console.log('1️⃣ Testing Enhanced Description...');
  try {
    const prompt = `Create a compelling marketing description for this rental property:

Property: ${propertyData.title}
Location: ${propertyData.location.city}, ${propertyData.location.country}
Current description: ${propertyData.description}
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
          content: 'You are an expert copywriter for luxury vacation rentals.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const enhancedDescription = response.choices[0].message.content;
    console.log('✓ Enhanced description generated:');
    console.log(enhancedDescription.substring(0, 200) + '...\n');
  } catch (error) {
    console.error('✗ Enhanced description failed:', error.message);
  }

  // Test 2: Photo Analysis
  console.log('2️⃣ Testing Photo Analysis...');
  try {
    const photoCount = propertyData.images.length;

    const prompt = `Analyze ${photoCount} property photos for a vacation rental listing.

Property: ${propertyData.title}
Location: ${propertyData.location.city}, ${propertyData.location.country}
Photo count: ${photoCount}

Task: Provide professional photography analysis for short-term rental listing.

Return JSON format:
{
  "overallScore": 7,
  "strengths": ["list of 3-4 strengths"],
  "missing": ["list of 2-3 missing photo types"],
  "recommendations": ["list of 4-5 specific improvements"],
  "sequenceAdvice": "advice on photo order"
}

Focus on:
- What photo types are likely present (exterior, bedrooms, kitchen, etc.)
- What's typically missing for vacation rentals
- How to improve photography to increase bookings
- Optimal photo sequence for maximum impact`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a professional real estate photographer and vacation rental marketing expert.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 800
    });

    const photoAnalysis = JSON.parse(response.choices[0].message.content);
    console.log('✓ Photo analysis generated:');
    console.log(`  Score: ${photoAnalysis.overallScore}/10`);
    console.log(`  Strengths: ${photoAnalysis.strengths.length}`);
    console.log(`  Missing: ${photoAnalysis.missing.length}`);
    console.log(`  Recommendations: ${photoAnalysis.recommendations.length}\n`);
  } catch (error) {
    console.error('✗ Photo analysis failed:', error.message);
  }

  console.log('✅ Upsell test complete!');
}

testUpsells();
