const Anthropic = require('@anthropic-ai/sdk');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).send(`
        <h1>❌ No API Key</h1>
        <p>ANTHROPIC_API_KEY is not set in environment variables</p>
      `);
    }

    res.write(`<h1>🔍 Anthropic API Debug</h1>`);
    res.write(`<p><strong>API Key found:</strong> ${apiKey.substring(0, 15)}...</p>`);
    res.write(`<p><strong>API Key length:</strong> ${apiKey.length}</p>`);
    res.write(`<hr>`);
    res.write(`<h2>Testing models...</h2>`);

    const anthropic = new Anthropic({ apiKey });

    // Test different models
    const modelsToTest = [
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-3-opus-20240229',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet-20250114'
    ];

    for (const modelName of modelsToTest) {
      try {
        res.write(`<p>Testing <strong>${modelName}</strong>... `);

        const message = await anthropic.messages.create({
          model: modelName,
          max_tokens: 100,
          messages: [{
            role: 'user',
            content: 'Say hello in one word'
          }],
        });

        res.write(`<span style="color: green;">✅ SUCCESS</span></p>`);
        res.write(`<pre style="background: #f0f0f0; padding: 10px;">${JSON.stringify(message, null, 2)}</pre>`);
        break; // Found working model
      } catch (error) {
        res.write(`<span style="color: red;">❌ FAILED: ${error.message}</span></p>`);
      }
    }

    res.write(`<hr><p><a href="/">← Back to Home</a></p>`);
    res.end();

  } catch (error) {
    res.status(500).send(`
      <h1>❌ Error</h1>
      <pre>${error.stack}</pre>
    `);
  }
};
