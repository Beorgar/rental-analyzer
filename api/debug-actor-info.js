const { ApifyClient } = require('apify-client');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  try {
    const apifyClient = new ApifyClient({
      token: process.env.APIFY_API_TOKEN,
    });

    const actorId = 'DGJcpo1UpGl5HRnkC';

    let html = '<h1>🔍 Actor Information</h1>';
    html += `<p>Fetching information for actor ID: <strong>${actorId}</strong></p>`;
    html += '<hr>';

    // Try to get actor info
    try {
      const actor = await apifyClient.actor(actorId).get();

      html += '<h2>✅ Actor Found</h2>';
      html += '<ul>';
      html += `<li><strong>Name:</strong> ${actor.name}</li>`;
      html += `<li><strong>Username:</strong> ${actor.username}</li>`;
      html += `<li><strong>Full ID:</strong> ${actor.username}/${actor.name}</li>`;
      html += `<li><strong>Title:</strong> ${actor.title || 'N/A'}</li>`;
      html += `<li><strong>Description:</strong> ${actor.description || 'N/A'}</li>`;
      html += `<li><strong>Version:</strong> ${actor.taggedBuilds?.latest || actor.defaultRunBuild || 'N/A'}</li>`;
      html += '</ul>';

      html += '<hr>';
      html += '<h3>Full Actor Object:</h3>';
      html += `<pre style="background: #f0f0f0; padding: 15px; overflow-x: auto;">${JSON.stringify(actor, null, 2)}</pre>`;

    } catch (error) {
      html += `<p style="color: red;">❌ Could not fetch actor info: ${error.message}</p>`;
      html += `<pre>${error.stack}</pre>`;
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
