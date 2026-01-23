const { ApifyClient } = require('apify-client');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const startTime = Date.now();
  let html = '';

  try {
    html += `<h1>🔍 Apify Debug - Paul's Studio</h1>`;

    const apifyClient = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });

    const url = 'https://www.booking.com/hotel/at/paul-39-s-studio.ru.html?aid=356980&label=gog235jc-10CAsoDkIQcGF1bC0zOS1zLXN0dWRpb0gzWANoDogBAZgBM7gBF8gBDNgBA-gBAfgBAYgCAagCAbgC2JrKywbAAgHSAiQxYTFiZWU3OC1lZTZiLTQ2NDgtOGFjYi1iMDI4MjhhNWEyYjTYAgHgAgE';

    html += `<p><strong>Testing URL:</strong> ${url}</p>`;
    html += `<p>⏳ Starting Apify scraper...</p>`;
    html += `<hr>`;

    // Run Booking.com scraper
    const run = await apifyClient.actor('dtrungtin/booking-scraper').call({
      search: url,
      maxItems: 1,
      checkIn: new Date().toISOString().split('T')[0],
      checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      currency: 'EUR',
      language: 'en-gb',
      propertyType: 'none',
      minScore: '0',
    });

    const executionTime = ((Date.now() - startTime) / 1000).toFixed(1);
    html += `<p>✅ Actor finished in ${executionTime}s. Run ID: ${run.id}</p>`;

    // Fetch results
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    html += `<h2>📊 Results (${items.length} items)</h2>`;

    if (items.length === 0) {
      html += `<p style="color: red;">❌ No data returned!</p>`;
    } else {
      const property = items[0];

      html += `<h3>Raw Data from Apify:</h3>`;
      html += `<pre style="background: #f0f0f0; padding: 15px; overflow-x: auto;">${JSON.stringify(property, null, 2)}</pre>`;

      html += `<hr>`;
      html += `<h3>Key Fields:</h3>`;
      html += `<ul>`;
      html += `<li><strong>Name:</strong> ${property.name || property.hotel_name || 'N/A'}</li>`;
      html += `<li><strong>City:</strong> ${property.city || 'N/A'}</li>`;
      html += `<li><strong>Price:</strong> ${property.price || property.minPrice || 'N/A'}</li>`;
      html += `<li><strong>Rating:</strong> ${property.rating || property.reviewScore || 'N/A'}</li>`;
      html += `<li><strong>Review Count:</strong> ${property.reviewCount || property.reviews_count || 'N/A'}</li>`;
      html += `<li><strong>Max Persons:</strong> ${property.maxPersons || property.max_persons || 'N/A'}</li>`;
      html += `<li><strong>Images count:</strong> ${property.images?.length || 0}</li>`;
      html += `<li><strong>Facilities:</strong> ${JSON.stringify(property.facilities || property.amenities || [])}</li>`;
      html += `</ul>`;
    }

    html += `<hr><p><a href="/">← Back to Home</a></p>`;

    res.status(200).send(html);

  } catch (error) {
    res.status(500).send(`
      <h1>❌ Error</h1>
      <pre>${error.stack}</pre>
      <p>${error.message}</p>
      <p><strong>Time elapsed:</strong> ${((Date.now() - startTime) / 1000).toFixed(1)}s</p>
    `);
  }
};
