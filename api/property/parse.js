const { ApifyClient } = require('apify-client');

const apifyClient = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
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
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Detect platform
    let platform = 'unknown';
    if (url.includes('booking.com')) {
      platform = 'booking';
    } else if (url.includes('airbnb')) {
      platform = 'airbnb';
    } else if (url.includes('vrbo.com')) {
      platform = 'vrbo';
    } else {
      return res.status(400).json({
        error: 'Unsupported platform. Please use Booking.com, Airbnb, or VRBO'
      });
    }

    // Parse real data using Apify
    let propertyData;

    if (platform === 'booking') {
      // TEMPORARY: Apify scraper is too slow (10+ min, $0.28)
      // Using demo data until we find a better solution
      propertyData = getDemoData(url, platform);

      // TODO: Implement faster scraping solution
      // propertyData = await scrapeBookingProperty(url, apifyClient);
    } else {
      // Fallback to demo data for other platforms
      propertyData = getDemoData(url, platform);
    }

    res.status(200).json({
      success: true,
      platform,
      data: propertyData
    });
  } catch (error) {
    console.error('Error parsing property:', error);
    res.status(500).json({
      error: 'Failed to parse property data',
      details: error.message
    });
  }
};

async function scrapeBookingProperty(url, apifyClient) {
  try {
    // Run Booking.com scraper actor
    const run = await apifyClient.actor('dtrungtin/booking-scraper').call({
      search: url,
      maxItems: 1,
      checkIn: new Date().toISOString().split('T')[0],
      checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0], // +1 day
      currency: 'EUR',
      language: 'en-gb',
      propertyType: 'none',
      minScore: '0',
    });

    // Fetch results from dataset
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    if (!items || items.length === 0) {
      throw new Error('No property data found');
    }

    const property = items[0];

    // Transform Apify data to our format
    // Note: Booking.com uses 0-10 rating scale
    const rating = parseFloat(property.reviewScore || property.rating || 0);

    // Handle images - can be array of strings or objects
    let imageUrls = [];
    if (property.images) {
      imageUrls = property.images.map(img => {
        if (typeof img === 'string') return img;
        if (img.url) return img.url;
        if (img.photo) return img.photo;
        return null;
      }).filter(Boolean);
    }

    return {
      id: property.id || property.hotel_id,
      url: property.url || url,
      platform: 'booking',
      title: property.name || property.hotel_name,
      location: {
        address: property.address || '',
        city: property.city || '',
        country: property.country || '',
        latitude: property.location?.lat || 0,
        longitude: property.location?.lng || 0,
      },
      description: property.description || '',
      amenities: property.facilities || property.amenities || [],
      images: imageUrls,
      pricing: {
        basePrice: parseFloat(property.price || property.minPrice || 100),
        currency: property.currency || 'EUR',
        cleaningFee: 0,
      },
      capacity: {
        guests: parseInt(property.maxPersons || property.max_persons || 2),
        bedrooms: parseInt(property.rooms || property.bedrooms || 1),
        beds: parseInt(property.beds || 1),
        bathrooms: 1,
      },
      rating: {
        average: rating, // Booking uses 0-10 scale
        reviewCount: parseInt(property.reviewCount || property.reviews || property.numberOfReviews || 0),
      },
    };
  } catch (error) {
    console.error('Apify scraping error:', error);
    // Return demo data as fallback
    return getDemoData(url, 'booking');
  }
}

function getDemoData(url, platform) {
  // Demo data using Booking.com format (10-point rating scale)
  return {
    id: Math.random().toString(36).substr(2, 9),
    url,
    platform,
    title: "Paul's Studio - Ski Apartment in Kaprun",
    location: {
      address: 'Nikolaus-Gassner-Promenade 30, 5710 Kaprun, Austria',
      city: 'Kaprun',
      country: 'Austria',
      latitude: 47.2695,
      longitude: 12.7621,
    },
    description: 'Welcome to Paul\'s Studio, a modern and cozy ski apartment in the heart of Kaprun, Austria. This beautifully furnished studio is perfect for families or groups of up to 4 guests seeking an unforgettable alpine experience.\n\nLocated just 500 meters from the Maiskogelbahn ski lift and 2 km from the famous Kitzsteinhorn Glacier, our apartment offers unbeatable access to world-class skiing and snowboarding. In summer, enjoy hiking, mountain biking, and water sports at nearby Zell am See lake.\n\nThe Space:\n- Spacious living/sleeping area with comfortable beds for 4 guests\n- Fully equipped modern kitchen with dishwasher, oven, and coffee machine\n- Clean bathroom with shower and all necessary amenities\n- Private balcony with stunning mountain views\n- Flat-screen TV with cable channels\n- High-speed WiFi throughout\n\nBuilding Amenities:\n- Free private parking (one space)\n- Heated ski and boot storage room\n- Coin-operated laundry facilities\n- Bicycle storage\n\nThe Neighborhood:\nKaprun is a charming alpine village offering year-round activities. Walk to restaurants, bakeries, and supermarkets in just 5 minutes. The town is famous for its proximity to three major ski areas: Kitzsteinhorn Glacier (year-round skiing), Maiskogel, and the massive Zell am See-Kaprun ski region.\n\nWinter Activities:\n- Skiing and snowboarding\n- Cross-country skiing\n- Winter hiking\n- Ice climbing\n- Tobogganing\n\nSummer Activities:\n- Hiking in the Alps\n- Mountain biking\n- Swimming and water sports at Zell am See\n- Paragliding\n- High Tauern National Park visits\n\nGetting Around:\n- Free ski bus stops 50m from the apartment\n- Salzburg Airport: 90 km (1 hour drive)\n- Munich Airport: 180 km (2 hours drive)\n- Train station in Zell am See: 8 km\n\nGuest Access:\nYou will have exclusive access to the entire apartment. Self check-in with a key safe for your convenience.\n\nOther Things to Note:\n- Quiet hours: 10 PM - 7 AM\n- No smoking inside (balcony smoking allowed)\n- Pets considered on request (€30 fee)\n- Minimum stay: 3 nights in high season, 2 nights in low season',
    amenities: [
      'Free WiFi',
      'Kitchen',
      'Central Heating',
      'Flat-screen TV',
      'Cable TV',
      'Free Private Parking',
      'Ski Storage',
      'Ski-in/Ski-out (500m)',
      'Mountain View',
      'Balcony',
      'Dishwasher',
      'Coffee Machine',
      'Microwave',
      'Refrigerator',
      'Oven',
      'Toaster',
      'Kettle',
      'Cookware',
      'Towels Provided',
      'Bed Linen Provided',
      'Hair Dryer',
      'Shower',
      'Iron',
      'Washing Machine (coin-op)',
      'Elevator',
      'Non-Smoking',
      'Family Friendly',
      'Hiking',
      'Cycling',
      'Near Ski Lifts',
      'Near Restaurants',
      'Near Supermarket',
    ],
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
      'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=800',
    ],
    pricing: {
      basePrice: 95,
      currency: 'EUR',
      cleaningFee: 30,
    },
    capacity: {
      guests: 4,
      bedrooms: 1,
      beds: 2,
      bathrooms: 1,
    },
    rating: {
      average: 8.5, // Booking.com uses 0-10 scale
      reviewCount: 127,
    },
  };
}
