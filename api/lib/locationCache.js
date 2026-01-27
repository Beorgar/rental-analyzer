const CACHE_TTL_DAYS = 90; // Refresh data every 90 days

/**
 * Initialize Supabase client
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Supabase credentials not set, caching disabled');
    return null;
  }

  // Optional dependency - only require if credentials are set
  let createClient;
  try {
    createClient = require('@supabase/supabase-js').createClient;
  } catch (err) {
    console.warn('⚠️  @supabase/supabase-js not installed, caching disabled');
    console.warn('   Run: npm install @supabase/supabase-js');
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Get cached location research data
 * @param {string} city - City name
 * @param {string} country - Country name
 * @returns {Object|null} Cached research data or null if not found/expired
 */
async function getCachedResearch(city, country) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('location_research')
      .select('*')
      .eq('city', city)
      .eq('country', country)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - this is normal
        console.log(`  → No cached data for ${city}, ${country}`);
        return null;
      }
      throw error;
    }

    if (!data) return null;

    // Check if cache is expired
    const cacheDate = new Date(data.updated_at);
    const now = new Date();
    const daysSinceUpdate = (now - cacheDate) / (1000 * 60 * 60 * 24);

    if (daysSinceUpdate > CACHE_TTL_DAYS) {
      console.log(`  → Cache expired for ${city} (${Math.round(daysSinceUpdate)} days old)`);
      return null;
    }

    console.log(`  ✓ Using cached data for ${city} (${Math.round(daysSinceUpdate)} days old)`);
    return data.research_data;

  } catch (error) {
    console.error('❌ Error reading from cache:', error.message);
    return null;
  }
}

/**
 * Save location research data to cache
 * @param {string} city - City name
 * @param {string} country - Country name
 * @param {Object} researchData - Research data to cache
 */
async function cacheResearch(city, country, researchData) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('location_research')
      .upsert({
        city,
        country,
        research_data: researchData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'city,country'
      });

    if (error) throw error;

    console.log(`  ✓ Cached research data for ${city}, ${country}`);

  } catch (error) {
    console.error('❌ Error saving to cache:', error.message);
  }
}

/**
 * Get location research with caching
 * Falls back to provided research function if cache miss
 * @param {string} city - City name
 * @param {string} country - Country name
 * @param {Function} researchFunction - Function to call if cache miss
 * @returns {Object} Research data
 */
async function getOrFetchResearch(city, country, researchFunction) {
  // Try cache first
  const cached = await getCachedResearch(city, country);
  if (cached) {
    return cached;
  }

  // Cache miss - fetch new data
  console.log(`  → Fetching fresh research data for ${city}, ${country}...`);
  const freshData = await researchFunction({ city, country });

  // Save to cache for next time
  if (freshData) {
    await cacheResearch(city, country, freshData);
  }

  return freshData;
}

module.exports = {
  getCachedResearch,
  cacheResearch,
  getOrFetchResearch
};
