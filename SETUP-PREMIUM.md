# Premium Features Setup Guide

Comprehensive guide for enabling premium features that significantly improve report quality.

## Quality Tiers

### Basic (€0.01/report, 99.9% margin)
- Single AI model (GPT-4o-mini)
- AI knowledge only
- Good for testing

### Premium (€0.08/report, 98.8% margin)
- **LLM Council**: Multi-model consensus (GPT-4 + Claude + Gemini)
- **Tavily Search**: Real-time tourism data
- **Supabase Cache**: 80% cost reduction
- **Best quality**: Data-driven, accurate reports

---

## 1. LLM Council (Multi-Model Analysis)

Uses multiple AI models for consensus analysis - significantly improves quality.

### Enable

Add to `.env`:
```bash
USE_LLM_COUNCIL=true
```

### Get API Keys

Need at least ONE additional model:

**Anthropic (Claude) - Recommended**
1. Visit: https://console.anthropic.com/
2. Create API key
3. Add to `.env`:
```bash
ANTHROPIC_API_KEY=sk-ant-your_key_here
```
Cost: $3/1M tokens (~€0.03/report)

**Google AI (Gemini) - Optional**
1. Visit: https://ai.google.dev/
2. Get API key (free tier available!)
3. Add to `.env`:
```bash
GOOGLE_AI_API_KEY=your_key_here
```

### How It Works

1. System queries GPT-4, Claude, and Gemini in parallel
2. Each model provides independent analysis
3. GPT-4 synthesizes responses into consensus
4. Result: More accurate, reliable analysis

---

## 2. Tavily Search (Real Tourism Data)

Provides real-time data: events, festivals, statistics, seasonal patterns.

### Setup

1. Visit: https://app.tavily.com/
2. Sign up and get API key
3. Add to `.env`:
```bash
TAVILY_API_KEY=tvly-your_key_here
```
Cost: $0.001/search (~€0.004/report)

### What It Finds

For each location, searches for:
- Major events and festivals
- Tourism statistics and demographics
- School holidays impact (German, Austrian, Swiss tourists)
- Main attractions and tourist patterns

Example for Zell am See:
- Kitzsteinhorn Glacier ski season
- Summer Arab tourist flow
- Ironman Zell am See event
- School holiday periods from source countries

---

## 3. Supabase Cache (80% Cost Reduction)

Caches tourism research for 90 days - huge cost savings on repeated locations.

### Benefits
- 80% cost reduction on repeated searches
- Faster report generation
- 500MB free tier (thousands of locations)

### Setup

**Step 1: Create Project**
1. Visit: https://app.supabase.com/
2. Create new project
3. Wait ~2 minutes for provisioning

**Step 2: Create Table**
1. Go to SQL Editor
2. Run this SQL (from `database/supabase-schema.sql`):
```sql
CREATE TABLE IF NOT EXISTS location_research (
  id BIGSERIAL PRIMARY KEY,
  city VARCHAR(255) NOT NULL,
  country VARCHAR(255) NOT NULL,
  research_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(city, country)
);

CREATE INDEX idx_location_lookup ON location_research(city, country);
CREATE INDEX idx_updated_at ON location_research(updated_at);

ALTER TABLE location_research ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access"
ON location_research FOR SELECT USING (true);
```

**Step 3: Get Credentials**
1. Go to Project Settings > API
2. Copy Project URL and anon key
3. Add to `.env`:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Step 4: Deploy to Vercel**
1. Add SUPABASE_URL and SUPABASE_KEY to Vercel env vars
2. Redeploy

### How It Works

**First request:** Vienna, Austria
- Searches Tavily (€0.004)
- Saves to Supabase
- Generates report

**Second request:** Vienna, Austria (within 90 days)
- Reads from Supabase (free, instant)
- Generates report
- Saves €0.004

---

## Complete Setup Checklist

### Required (Basic)
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_PUBLISHABLE_KEY
- [ ] OPENAI_API_KEY
- [ ] APIFY_API_TOKEN
- [ ] RESEND_API_KEY
- [ ] PDFSHIFT_API_KEY

### Premium (Recommended)
- [ ] USE_LLM_COUNCIL=true
- [ ] ANTHROPIC_API_KEY (Claude)
- [ ] GOOGLE_AI_API_KEY (Gemini, optional)
- [ ] TAVILY_API_KEY (tourism data)
- [ ] SUPABASE_URL (caching)
- [ ] SUPABASE_KEY (caching)
- [ ] Run `database/supabase-schema.sql` in Supabase

---

## Testing

### Verify Console Logs

**LLM Council:**
```
🏛️  Consulting LLM Council...
  → Querying GPT-4...
  ✓ GPT-4 response received
  → Querying Claude Sonnet...
  ✓ Claude response received
✓ Received 3/3 responses from council
```

**Tavily Search:**
```
🔍 Researching tourism data for Vienna, Austria...
  → Searching: events
  ✓ Found 5 results for events
✓ Tourism research completed for Vienna
```

**Supabase Cache:**
```
First request:
  → Fetching fresh research data for Vienna, Austria...
  ✓ Cached research data for Vienna, Austria

Second request:
  ✓ Using cached data for Vienna (5 days old)
```

### Test Location

Recommended: **Zell am See, Austria** (complex seasonality)

Check report mentions:
- ✓ Kitzsteinhorn Glacier
- ✓ Ski season (Dec-Mar)
- ✓ Summer season patterns
- ✓ Specific events
- ✓ Real occupancy patterns

---

## Cost Analysis

### Per Report

| Setup | Cost | Margin | Quality |
|-------|------|--------|---------|
| Basic (gpt-4o-mini) | €0.01 | 99.9% | Good |
| Premium (Council + Tavily) | €0.08 | 98.8% | Excellent |
| Premium + Cache (80%) | €0.06 | 99.1% | Excellent |

### Monthly (1000 reports = €10,000 revenue)

| Setup | Cost | Profit |
|-------|------|--------|
| Basic | €10 | €9,990 |
| Premium | €80 | €9,920 |
| Premium + Cache | €64 | €9,936 |

**Recommendation:** Use Premium. Cost difference is only €0.07/report but quality improvement is significant for €10 reports.

---

## Model Selection

### GPT-4o-mini (default)
- Testing/development
- Simple locations
- Cost: $0.15/1M tokens (~€0.002/report)

### GPT-4
- Production
- Complex locations
- Set `OPENAI_MODEL=gpt-4` in .env
- Cost: $5/1M tokens (~€0.02/report)

### LLM Council (recommended)
- **Always** for €10 production reports
- Complex seasonality
- Multiple tourism factors
- Cost: ~€0.06-0.10/report

---

## Troubleshooting

### LLM Council Not Working
- Check `USE_LLM_COUNCIL=true` in .env
- Verify at least one API key (ANTHROPIC or GOOGLE_AI)
- System falls back to single model if fails

### Tavily Not Returning Data
- Verify `TAVILY_API_KEY` is correct
- Check Tavily dashboard for quota
- System continues with AI knowledge if fails
- Console: "⚠️  No tourism research data available"

### Supabase Cache Not Working
- Verify both SUPABASE_URL and SUPABASE_KEY
- Check table exists: `SELECT * FROM location_research;`
- System continues without caching if unavailable
- Console: "⚠️  Supabase credentials not set"

---

## Vercel Deployment

Add all variables to Vercel:

1. Vercel Dashboard > Project > Settings > Environment Variables
2. Add each premium variable:
   - USE_LLM_COUNCIL=true
   - ANTHROPIC_API_KEY=...
   - GOOGLE_AI_API_KEY=...
   - TAVILY_API_KEY=...
   - SUPABASE_URL=...
   - SUPABASE_KEY=...
3. Select: Production (+ Preview, Development)
4. Save and redeploy

---

## Summary

| Feature | Basic | Premium |
|---------|-------|---------|
| AI Models | 1 | 3 (consensus) |
| Tourism Data | AI knowledge | Real-time search |
| Events | Generic | Specific, dated |
| Accuracy | Good | Excellent |
| Cost/Report | €0.01 | €0.06 (cached) |
| Margin | 99.9% | 99.1% |
| Setup Time | 5 min | 20 min |

**For €10 reports, Premium setup is strongly recommended.** The cost difference (€0.06) is negligible compared to quality improvement.
