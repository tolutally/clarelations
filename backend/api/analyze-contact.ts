import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildContactContext } from '../lib/buildContactContext';
import { generateCompletion } from '../lib/openaiClient';
import { 
  SYSTEM_PROMPT, 
  buildRelationshipHealthPrompt, 
  buildNextActionPrompt,
  buildContextualResearchPrompt
} from '../lib/promptTemplates';

// Simple in-memory cache: key = "contactId:analysisType", value = { analysis, timestamp }
const analysisCache = new Map<string, { analysis: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * POST /api/analyze-contact
 * Analyzes a contact's relationship health and recommends next action
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { contactId, analysisType = 'relationship' } = req.body;

    console.log(`📥 Received request: contactId=${contactId}, analysisType=${analysisType}`);

    if (!contactId) {
      console.log('❌ Missing contactId');
      return res.status(400).json({ error: 'contactId is required' });
    }

    // Check cache first
    const cacheKey = `${contactId}:${analysisType}`;
    const cached = analysisCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`⚡ Returning cached analysis (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`);
      return res.json({
        success: true,
        analysis: cached.analysis,
        type: analysisType,
        contactId,
        cached: true
      });
    }

    // Build context from Supabase data
    console.log(`🔍 Building context for contact ${contactId}...`);
    const context = await buildContactContext(contactId);
    console.log(`✅ Context built successfully (${context.length} characters)`);

    // Choose appropriate prompt based on analysis type
    let userPrompt: string;
    if (analysisType === 'next-action') {
      userPrompt = buildNextActionPrompt(context);
      console.log(`📝 Using next-action prompt`);
    } else if (analysisType === 'contextual-research') {
      userPrompt = buildContextualResearchPrompt(context);
      console.log(`📝 Using contextual-research prompt`);
    } else {
      userPrompt = buildRelationshipHealthPrompt(context);
      console.log(`📝 Using relationship-health prompt`);
    }

    // Call OpenAI
    console.log(`🤖 Calling OpenAI...`);
    const analysis = await generateCompletion({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.7,
      maxTokens: 1000,
    });
    console.log(`✅ AI response generated (${analysis.length} chars)`);

    // Store in cache
    analysisCache.set(cacheKey, { analysis, timestamp: Date.now() });
    console.log(`💾 Cached analysis for ${cacheKey}`);

    res.json({
      success: true,
      analysis,
      type: analysisType,
      contactId,
      cached: false
    });
  } catch (error) {
    console.error('❌ Error analyzing contact:', error);
    res.status(500).json({
      error: 'Failed to analyze contact',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
