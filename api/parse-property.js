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

    // Mock data for demonstration
    // In production, use Apify actors to scrape real data
    const propertyData = {
      id: Math.random().toString(36).substr(2, 9),
      url,
      platform,
      title: 'Beautiful Apartment in City Center',
      location: {
        address: '123 Main Street',
        city: 'New York',
        country: 'USA',
        latitude: 40.7128,
        longitude: -74.0060,
      },
      description: 'Spacious 2-bedroom apartment with modern amenities and stunning city views...',
      amenities: ['WiFi', 'Kitchen', 'Air conditioning', 'Heating', 'TV', 'Washer', 'Parking'],
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      ],
      pricing: {
        basePrice: 150,
        currency: 'USD',
        cleaningFee: 50,
      },
      capacity: {
        guests: 4,
        bedrooms: 2,
        beds: 2,
        bathrooms: 1,
      },
      rating: {
        average: 4.8,
        reviewCount: 127,
      },
    };

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
