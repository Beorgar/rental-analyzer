const { ApifyClient } = require('apify-client');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const startTime = Date.now();

  try {
    const apifyClient = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });

    const url = 'https://www.booking.com/hotel/at/paul-39-s-studio.ru.html?aid=356980&label=gog235jc-10CAsoDkIQcGF1bC0zOS1zLXN0dWRpb0gzWANoDogBAZgBM7gBF8gBDNgBA-gBAfgBAYgCAagCAbgC2JrKywbAAgHSAiQxYTFiZWU3OC1lZTZiLTQ2NDgtOGFjYi1iMDI4MjhhNWEyYjTYAgHgAgE';

    // Calculate dates (30 days from now + 1 night)
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 30);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 1);

    const checkInStr = checkIn.toISOString().split('T')[0];
    const checkOutStr = checkOut.toISOString().split('T')[0];

    let html = '<h1>🚀 Voyager Booking Scraper Test (WITH DATES)</h1>';
    html += `<p><strong>Testing URL:</strong> ${url}</p>`;
    html += `<p><strong>Check-in:</strong> ${checkInStr}</p>`;
    html += `<p><strong>Check-out:</strong> ${checkOutStr}</p>`;
    html += '<p>⏳ Starting voyager/booking-scraper...</p>';
    html += '<hr>';

    // Run voyager/booking-scraper WITH dates
    const run = await apifyClient.actor('voyager/booking-scraper').call({
      startUrls: [{ url }],
      maxItems: 1,
      currency: 'EUR',
      language: 'en-gb',
      checkIn: checkInStr,
      checkOut: checkOutStr,
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

      html += '<h3>💰 PRICE INFORMATION:</h3>';
      html += '<ul style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107;">';
      html += `<li><strong>property.price:</strong> ${property.price || 'NULL'}</li>`;
      html += `<li><strong>property.currency:</strong> ${property.currency || 'NULL'}</li>`;
      html += `<li><strong>property.checkInDate:</strong> ${property.checkInDate || 'NULL'}</li>`;
      html += `<li><strong>property.checkOutDate:</strong> ${property.checkOutDate || 'NULL'}</li>`;
      html += '</ul>';

      html += '<hr>';
      html += '<h3>🎯 Key Values for Mapping:</h3>';
      html += '<ul>';
      html += `<li><strong>name:</strong> ${property.name || 'N/A'}</li>`;
      html += `<li><strong>city:</strong> ${JSON.stringify(property.address) || 'N/A'}</li>`;
      html += `<li><strong>rating:</strong> ${property.rating || 'N/A'}</li>`;
      html += `<li><strong>reviews:</strong> ${property.reviews || 'N/A'}</li>`;
      html += `<li><strong>hostInfo.welcomeMessage:</strong> ${property.hostInfo?.welcomeMessage ? property.hostInfo.welcomeMessage.substring(0, 100) + '...' : 'N/A'}</li>`;
      html += `<li><strong>images count:</strong> ${property.images ? property.images.length : 'N/A'}</li>`;
      html += `<li><strong>facilities count:</strong> ${property.facilities ? property.facilities.length : 'N/A'}</li>`;
      html += '</ul>';

      html += '<hr>';
      html += '<h3>🔍 Full Raw JSON:</h3>';
      html += `<pre style="background: #f0f0f0; padding: 15px; overflow-x: auto; max-height: 600px;">${JSON.stringify(property, null, 2)}</pre>`;
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
