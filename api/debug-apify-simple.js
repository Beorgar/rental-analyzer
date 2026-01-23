const { ApifyClient } = require('apify-client');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  try {
    const apifyClient = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });

    let html = '<h1>🔍 Apify Data Structure Debug</h1>';
    html += '<p>Fetching recent run data from your Apify account...</p>';
    html += '<hr>';

    // Get actor info and recent runs
    const runs = await apifyClient.actor('dtrungtin/booking-scraper').runs().list({ limit: 5 });

    html += `<h2>Recent Runs (${runs.items.length})</h2>`;
    html += '<ul>';
    for (const run of runs.items) {
      html += `<li>Run ID: ${run.id} | Status: ${run.status} | Started: ${run.startedAt}</li>`;
    }
    html += '</ul>';

    // Try to get data from a completed run
    const completedRun = runs.items.find(r => r.status === 'SUCCEEDED');

    if (completedRun) {
      html += `<hr><h2>Sample Data from Run: ${completedRun.id}</h2>`;

      const { items } = await apifyClient.dataset(completedRun.defaultDatasetId).listItems({ limit: 1 });

      if (items.length > 0) {
        const property = items[0];

        html += '<h3>Raw JSON Structure:</h3>';
        html += `<pre style="background: #f0f0f0; padding: 15px; overflow-x: auto; max-height: 500px;">${JSON.stringify(property, null, 2)}</pre>`;

        html += '<hr>';
        html += '<h3>Available Fields:</h3>';
        html += '<ul>';
        for (const key of Object.keys(property)) {
          html += `<li><strong>${key}:</strong> ${typeof property[key]} ${Array.isArray(property[key]) ? `(array, length: ${property[key].length})` : ''}</li>`;
        }
        html += '</ul>';

        html += '<hr>';
        html += '<h3>Key Field Values:</h3>';
        html += '<ul>';
        html += `<li><strong>name:</strong> ${property.name || 'N/A'}</li>`;
        html += `<li><strong>city:</strong> ${property.city || 'N/A'}</li>`;
        html += `<li><strong>country:</strong> ${property.country || 'N/A'}</li>`;
        html += `<li><strong>price:</strong> ${property.price || 'N/A'}</li>`;
        html += `<li><strong>rating:</strong> ${property.rating || 'N/A'}</li>`;
        html += `<li><strong>reviewScore:</strong> ${property.reviewScore || 'N/A'}</li>`;
        html += `<li><strong>reviews:</strong> ${property.reviews || 'N/A'}</li>`;
        html += `<li><strong>numberOfReviews:</strong> ${property.numberOfReviews || 'N/A'}</li>`;
        html += `<li><strong>maxPersons:</strong> ${property.maxPersons || 'N/A'}</li>`;
        html += `<li><strong>images:</strong> ${property.images ? `array with ${property.images.length} items` : 'N/A'}</li>`;
        if (property.images && property.images.length > 0) {
          html += `<li><strong>images[0] structure:</strong> ${JSON.stringify(property.images[0])}</li>`;
        }
        html += '</ul>';
      } else {
        html += '<p style="color: red;">No data in this dataset</p>';
      }
    } else {
      html += '<p style="color: orange;">No completed runs found. Please run the scraper first on Apify platform.</p>';
    }

    html += '<hr><p><a href="/">← Back to Home</a></p>';
    res.status(200).send(html);

  } catch (error) {
    res.status(500).send(`
      <h1>❌ Error</h1>
      <pre>${error.stack}</pre>
      <p>${error.message}</p>
    `);
  }
};
