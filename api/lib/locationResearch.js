/**
 * Research tourism data for a specific location using Tavily Search API
 * @param {Object} location - Location object with city, country, etc.
 * @returns {Object} Tourism research data
 */
async function researchLocation(location) {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    console.warn('⚠️  TAVILY_API_KEY not set, skipping tourism research');
    return null;
  }

  // Optional dependency - only require if API key is set
  let tavily;
  try {
    tavily = require('@tavily/core').tavily;
  } catch (err) {
    console.warn('⚠️  @tavily/core not installed, skipping tourism research');
    console.warn('   Run: npm install @tavily/core');
    return null;
  }

  try {
    const tvly = tavily({ apiKey });
    const { city, country } = location;

    console.log(`🔍 Researching tourism data for ${city}, ${country}...`);

    // Search for multiple aspects of tourism
    const searches = [
      // Local events and festivals
      {
        query: `${city} ${country} major events festivals 2026 2027 calendar`,
        topic: 'events',
      },
      // Tourist demographics and seasonality
      {
        query: `${city} ${country} tourism statistics peak season visitor demographics`,
        topic: 'demographics',
      },
      // School holidays impact (if relevant European destination)
      {
        query: `${city} ${country} school holidays tourism impact German Austrian Swiss tourists`,
        topic: 'schoolHolidays',
      },
      // Attractions and tourist patterns
      {
        query: `${city} ${country} main attractions tourist flow patterns seasonal tourism`,
        topic: 'attractions',
      },
    ];

    const results = {};

    for (const search of searches) {
      try {
        console.log(`  → Searching: ${search.topic}`);

        const response = await tvly.search(search.query, {
          searchDepth: 'advanced',
          maxResults: 5,
        });

        results[search.topic] = {
          query: search.query,
          results: response.results || [],
          answer: response.answer || '',
        };

        console.log(`  ✓ Found ${results[search.topic].results.length} results for ${search.topic}`);
      } catch (err) {
        console.error(`  ✗ Error searching ${search.topic}:`, err.message);
        results[search.topic] = { query: search.query, results: [], answer: '', error: err.message };
      }
    }

    console.log(`✓ Tourism research completed for ${city}`);

    return {
      location: { city, country },
      timestamp: new Date().toISOString(),
      searches: results,
    };

  } catch (error) {
    console.error('❌ Error in location research:', error);
    return null;
  }
}

/**
 * Format research results into a concise summary for the LLM
 * @param {Object} research - Research data from researchLocation
 * @returns {string} Formatted summary
 */
function formatResearchSummary(research) {
  if (!research || !research.searches) {
    return 'No tourism research data available.';
  }

  let summary = `# Tourism Research for ${research.location.city}, ${research.location.country}\n\n`;
  summary += `Research Date: ${new Date(research.timestamp).toLocaleDateString()}\n\n`;

  const { events, demographics, schoolHolidays, attractions } = research.searches;

  if (events?.answer) {
    summary += `## Major Events & Festivals\n${events.answer}\n\n`;
  }

  if (demographics?.answer) {
    summary += `## Tourism Statistics & Demographics\n${demographics.answer}\n\n`;
  }

  if (schoolHolidays?.answer) {
    summary += `## School Holidays Impact\n${schoolHolidays.answer}\n\n`;
  }

  if (attractions?.answer) {
    summary += `## Attractions & Tourist Patterns\n${attractions.answer}\n\n`;
  }

  // Add sources
  summary += `## Sources\n`;
  for (const [topic, data] of Object.entries(research.searches)) {
    if (data.results && data.results.length > 0) {
      summary += `\n**${topic}:**\n`;
      data.results.forEach((result, idx) => {
        summary += `${idx + 1}. ${result.title} - ${result.url}\n`;
      });
    }
  }

  return summary;
}

module.exports = {
  researchLocation,
  formatResearchSummary
};
