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
      address: 'Nikolaus-Gassner-Promenade, 5710 Kaprun, Austria',
      city: 'Kaprun',
      country: 'Austria',
      latitude: 47.2695,
      longitude: 12.7621,
    },
    description: 'Cozy studio apartment perfect for ski holidays. Located in Kaprun near Kitzsteinhorn glacier and Zell am See. Features modern amenities and easy access to ski lifts.',
    amenities: ['Free WiFi', 'Kitchen', 'Heating', 'Flat-screen TV', 'Free Parking', 'Ski Storage', 'Near Ski Lifts', 'Mountain View'],
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
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
