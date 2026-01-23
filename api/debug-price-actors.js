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

    let html = '<h1>🔍 Testing Price-Focused Apify Actors</h1>';
    html += `<p><strong>Testing URL:</strong> Paul's Studio, Kaprun</p>`;
    html += `<p><strong>Check-in:</strong> ${checkInStr} | <strong>Check-out:</strong> ${checkOutStr}</p>`;
    html += '<hr>';

    // List of actors to test
    const actorsToTest = [
      {
        name: 'jupri/booking-hotels (Booking Explorer)',
        id: 'jupri/booking-hotels',
        input: {
          search: 'Paul\'s Studio Kaprun',
          checkIn: checkInStr,
          checkOut: checkOutStr,
          currency: 'EUR',
        },
      },
      {
        name: 'voyager/fast-booking-scraper',
        id: 'voyager/fast-booking-scraper',
        input: {
          startUrls: [{ url }],
          maxItems: 1,
          currency: 'EUR',
          checkIn: checkInStr,
          checkOut: checkOutStr,
        },
      },
      {
        name: 'dtrungtin/simple-booking-scraper',
        id: 'dtrungtin/simple-booking-scraper',
        input: {
          search: url,
          maxItems: 1,
          checkIn: checkInStr,
          checkOut: checkOutStr,
          currency: 'EUR',
        },
      },
    ];

    // Test each actor
    for (const actor of actorsToTest) {
      html += `<h2>🧪 Testing: ${actor.name}</h2>`;
      html += '<div style="background: #f0f0f0; padding: 15px; margin: 10px 0;">';

      const actorStartTime = Date.now();

      try {
        html += `<p>⏳ Starting ${actor.id}...</p>`;

        // Check if actor exists first
        let actorInfo;
        try {
          actorInfo = await apifyClient.actor(actor.id).get();
          html += `<p>✅ Actor found: <strong>${actorInfo.title || actorInfo.name}</strong></p>`;
        } catch (err) {
          html += `<p style="color: red;">❌ Actor not found or not accessible: ${err.message}</p>`;
          html += '</div><hr>';
          continue;
        }

        // Run the actor
        const run = await apifyClient.actor(actor.id).call(actor.input, {
          timeout: 120, // 2 minutes max
        });

        const executionTime = ((Date.now() - actorStartTime) / 1000).toFixed(1);

        html += `<p><strong>Status:</strong> ${run.status}</p>`;
        html += `<p><strong>Duration:</strong> ${executionTime}s</p>`;
        html += `<p><strong>Cost:</strong> $${run.usageTotalUsd || 'N/A'}</p>`;
        html += `<p><strong>Run ID:</strong> ${run.id}</p>`;

        // Fetch results
        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

        html += `<p><strong>Results:</strong> ${items.length} item(s)</p>`;

        if (items.length > 0) {
          const property = items[0];

          html += '<h3>💰 PRICE DATA:</h3>';
          html += '<ul style="background: #fff3cd; padding: 10px; border-left: 4px solid #ffc107;">';
          html += `<li><strong>price:</strong> ${property.price || 'NULL'}</li>`;
          html += `<li><strong>minPrice:</strong> ${property.minPrice || 'NULL'}</li>`;
          html += `<li><strong>maxPrice:</strong> ${property.maxPrice || 'NULL'}</li>`;
          html += `<li><strong>currency:</strong> ${property.currency || 'NULL'}</li>`;
          html += `<li><strong>priceBreakdown:</strong> ${JSON.stringify(property.priceBreakdown || null)}</li>`;
          html += '</ul>';

          html += '<h3>📋 Other Key Fields:</h3>';
          html += '<ul>';
          html += `<li><strong>name:</strong> ${property.name || property.hotel_name || 'N/A'}</li>`;
          html += `<li><strong>city:</strong> ${property.city || property.address?.city || 'N/A'}</li>`;
          html += `<li><strong>rating:</strong> ${property.rating || property.reviewScore || 'N/A'}</li>`;
          html += '</ul>';

          html += '<details style="margin-top: 10px;"><summary><strong>Show Full JSON</strong></summary>';
          html += `<pre style="background: #f9f9f9; padding: 10px; overflow-x: auto; max-height: 400px;">${JSON.stringify(property, null, 2)}</pre>`;
          html += '</details>';
        } else {
          html += '<p style="color: red;">❌ No results returned</p>';
        }

      } catch (error) {
        const executionTime = ((Date.now() - actorStartTime) / 1000).toFixed(1);
        html += `<p style="color: red;">❌ Error: ${error.message}</p>`;
        html += `<p>Time: ${executionTime}s</p>`;
        html += `<pre style="font-size: 0.8em; color: #666;">${error.stack}</pre>`;
      }

      html += '</div><hr>';
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    html += `<p><strong>Total execution time:</strong> ${totalTime}s</p>`;
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
