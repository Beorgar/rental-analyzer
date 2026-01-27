const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk').default;
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * LLM Council - Query multiple AI models and aggregate results
 * Provides more reliable analysis through consensus
 */

/**
 * Query GPT-4 (OpenAI)
 */
async function queryGPT4(prompt, systemPrompt) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  OpenAI API key not set, skipping GPT-4');
    return null;
  }

  try {
    console.log('  → Querying GPT-4...');
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content;
    console.log('  ✓ GPT-4 response received');
    return { model: 'gpt-4', content, tokens: response.usage.total_tokens };

  } catch (error) {
    console.error('  ✗ GPT-4 error:', error.message);
    return null;
  }
}

/**
 * Query Claude Sonnet (Anthropic)
 */
async function queryClaude(prompt, systemPrompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  Anthropic API key not set, skipping Claude');
    return null;
  }

  try {
    console.log('  → Querying Claude Sonnet...');
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        { role: 'user', content: prompt },
      ],
    });

    const content = response.content[0].text;
    console.log('  ✓ Claude response received');
    return {
      model: 'claude-3-5-sonnet',
      content,
      tokens: response.usage.input_tokens + response.usage.output_tokens
    };

  } catch (error) {
    console.error('  ✗ Claude error:', error.message);
    return null;
  }
}

/**
 * Query Gemini (Google)
 */
async function queryGemini(prompt, systemPrompt) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  Google AI API key not set, skipping Gemini');
    return null;
  }

  try {
    console.log('  → Querying Gemini...');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const fullPrompt = `${systemPrompt}\n\n${prompt}`;
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const content = response.text();

    console.log('  ✓ Gemini response received');
    return { model: 'gemini-1.5-pro', content, tokens: null };

  } catch (error) {
    console.error('  ✗ Gemini error:', error.message);
    return null;
  }
}

/**
 * Parse JSON from LLM response (handles markdown code blocks)
 */
function parseJSONResponse(content) {
  try {
    // Try direct parse first
    return JSON.parse(content);
  } catch {
    // Try extracting from markdown code block
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    throw new Error('Could not parse JSON from response');
  }
}

/**
 * Query all available models in the council
 */
async function queryCouncil(prompt, systemPrompt) {
  console.log('🏛️  Consulting LLM Council...');

  const responses = await Promise.all([
    queryGPT4(prompt, systemPrompt),
    queryClaude(prompt, systemPrompt),
    queryGemini(prompt, systemPrompt),
  ]);

  // Filter out null responses (failed queries)
  const validResponses = responses.filter(r => r !== null);

  if (validResponses.length === 0) {
    throw new Error('All LLM Council members failed to respond');
  }

  console.log(`✓ Received ${validResponses.length}/${responses.length} responses from council`);

  return validResponses;
}

/**
 * Aggregate responses using a synthesis model
 * Takes multiple analyses and creates a consensus report
 */
async function synthesizeCouncilResponses(responses, propertyData) {
  if (responses.length === 0) {
    throw new Error('No responses to synthesize');
  }

  // If only one response, use it directly
  if (responses.length === 1) {
    console.log('  → Using single response (no synthesis needed)');
    return parseJSONResponse(responses[0].content);
  }

  console.log('  → Synthesizing council responses...');

  // Parse all responses
  const parsedResponses = [];
  for (const response of responses) {
    try {
      const parsed = parseJSONResponse(response.content);
      parsedResponses.push({ model: response.model, data: parsed });
    } catch (error) {
      console.warn(`  ⚠️  Could not parse response from ${response.model}:`, error.message);
    }
  }

  if (parsedResponses.length === 0) {
    throw new Error('Could not parse any council responses');
  }

  // Use GPT-4 to synthesize the responses (it's good at this task)
  const synthesisPrompt = `You are synthesizing multiple AI analyses of a rental property into a single, high-quality consensus report.

You have received ${parsedResponses.length} analyses from different AI models:

${parsedResponses.map((r, i) => `
## Analysis ${i + 1} (${r.model}):
${JSON.stringify(r.data, null, 2)}
`).join('\n')}

Your task:
1. Compare the analyses and identify consensus points
2. Where models disagree, use your judgment to determine the most accurate assessment
3. Combine the best insights from each analysis
4. Produce a single, comprehensive JSON report in the expected format

Focus on:
- Taking the median/average for price recommendations
- Combining unique insights from each model
- Ensuring consistency in seasonality analysis
- Providing the most accurate tourism insights

Output a single JSON object with the complete analysis.`;

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at synthesizing multiple analyses into a single, high-quality consensus report. Always output valid JSON.'
        },
        { role: 'user', content: synthesisPrompt },
      ],
      temperature: 0.3, // Lower temperature for more consistent synthesis
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const synthesized = JSON.parse(response.choices[0].message.content);
    console.log('  ✓ Council synthesis complete');

    return synthesized;

  } catch (error) {
    console.error('  ✗ Synthesis failed:', error.message);
    // Fallback: use the first successfully parsed response
    console.log('  → Falling back to first parsed response');
    return parsedResponses[0].data;
  }
}

/**
 * Main function: Query council and synthesize results
 */
async function getCouncilAnalysis(prompt, systemPrompt, propertyData) {
  const responses = await queryCouncil(prompt, systemPrompt);
  const analysis = await synthesizeCouncilResponses(responses, propertyData);
  return analysis;
}

module.exports = {
  queryCouncil,
  synthesizeCouncilResponses,
  getCouncilAnalysis
};
