const { ApifyClient } = require('apify-client');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const startTime = Date.now();

  try {
    const apifyClient = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });

    const url = 'https://www.booking.com/hotel/at/paul-39-s-studio.ru.html?aid=356980&label=gog235jc-10CAsoDkIQcGF1bC0zOS1zLXN0dWRpb0gzWANoDogBAZgBM7gBF8gBDNgBA-gBAfgBAYgCAagCAbgC2JrKywbAAgHSAiQxYTFiZWU3OC1lZTZiLTQ2NDgtOGFjYi1iMDI4MjhhNWEyYjTYAgHgAgE';

    let html = '<h1>🚀 Voyager Booking Scraper Test</h1>';
    html += `<p><strong>Testing URL:</strong> ${url}</p>`;
    html += '<p>⏳ Starting voyager/booking-scraper...</p>';
    html += '<hr>';

    // Run voyager/booking-scraper
    const run = await apifyClient.actor('voyager/booking-scraper').call({
      startUrls: [{ url }],
      maxItems: 1,
      currency: 'EUR',
      language: 'en-gb',
    });

    const executionTime = ((Date.now() - startTime) / 1000).toFixed(1);
    html += `<p>✅ Actor finished in ${executionTime}s</p>`;
    html += `<p><strong>Run ID:</strong> ${run.id}</p>`;
    html += `<p><strong>Status:</strong> ${run.status}</p>`;
    html += `<p><strong>Cost:</strong> $${run.usageTotalUsd || 'N/A'}</p>`;
    html += '<hr>';

    // Fetch results
    const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

    html += `<h2>📊 Results: ${items.length} item(s)</h2>`;

    if (items.length === 0) {
      html += '<p style="color: red;">❌ No data returned!</p>';
    } else {
      const property = items[0];

      html += '<h3>🔍 Raw JSON Structure:</h3>';
      html += `<pre style="background: #f0f0f0; padding: 15px; overflow-x: auto; max-height: 600px;">${JSON.stringify(property, null, 2)}</pre>`;

      html += '<hr>';
      html += '<h3>📋 Available Fields:</h3>';
      html += '<ul>';
      for (const key of Object.keys(property)) {
        const value = property[key];
        const type = typeof value;
        const extra = Array.isArray(value) ? ` (array, length: ${value.length})` : '';
        html += `<li><strong>${key}:</strong> ${type}${extra}</li>`;
      }
      html += '</ul>';

      html += '<hr>';
      html += '<h3>🎯 Key Values for Mapping:</h3>';
      html += '<ul>';
      html += `<li><strong>name:</strong> ${property.name || 'N/A'}</li>`;
      html += `<li><strong>description:</strong> ${property.description ? property.description.substring(0, 100) + '...' : 'N/A'}</li>`;
      html += `<li><strong>address:</strong> ${property.address || 'N/A'}</li>`;
      html += `<li><strong>city:</strong> ${property.city || 'N/A'}</li>`;
      html += `<li><strong>country:</strong> ${property.country || 'N/A'}</li>`;
      html += `<li><strong>rating:</strong> ${property.rating || 'N/A'}</li>`;
      html += `<li><strong>stars:</strong> ${property.stars || 'N/A'}</li>`;
      html += `<li><strong>reviews:</strong> ${property.reviews || 'N/A'}</li>`;
      html += `<li><strong>price:</strong> ${property.price || 'N/A'}</li>`;
      html += `<li><strong>currency:</strong> ${property.currency || 'N/A'}</li>`;
      html += `<li><strong>images:</strong> ${property.images ? `array with ${property.images.length} items` : 'N/A'}</li>`;
      if (property.images && property.images.length > 0) {
        html += `<li><strong>images[0]:</strong> ${typeof property.images[0]} - ${typeof property.images[0] === 'string' ? property.images[0].substring(0, 80) + '...' : JSON.stringify(property.images[0])}</li>`;
      }
      html += '</ul>';
    }

    html += `<hr><p><strong>Total execution time:</strong> ${executionTime}s</p>`;
    html += '<p><a href="/">← Back to Home</a></p>';

    res.status(200).send(html);

  } catch (error) {
    const executionTime = ((Date.now() - startTime) / 1000).toFixed(1);
    res.status(500).send(`
      <h1>❌ Error</h1>
      <pre>${error.stack}</pre>
      <p><strong>Message:</strong> ${error.message}</p>
      <p><strong>Time elapsed:</strong> ${executionTime}s</p>
      <p><a href="/">← Back to Home</a></p>
    `);
  }
};
