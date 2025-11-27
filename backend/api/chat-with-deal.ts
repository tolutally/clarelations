import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildDealContext } from '../lib/buildDealContext';
import { generateCompletion } from '../lib/openaiClient';

const DEAL_CHAT_SYSTEM_PROMPT = `You are an AI sales assistant helping a salesperson with a specific deal.

You have access to all information about this deal including:
- Deal details (name, stage, value, description, use case)
- Contact information (name, company, position)
- Full activity history with transcripts from calls and meetings
- All notes and attachments
- Related deals with the same contact
- Timeline and metrics

Your role is to:
1. Answer questions accurately based ONLY on the available data
2. Provide actionable advice to help close the deal
3. Reference specific conversations, activities, and dates
4. Identify risks and opportunities
5. Suggest next best actions

Be concise, specific, and data-driven. ALWAYS cite your sources with dates 
(e.g., "In your call on Jan 15..." or "According to the note from...").

If you don't have enough information to answer accurately, say so clearly 
and suggest what information would be helpful.

Format your responses in clear paragraphs with bullet points where appropriate.`;

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

/**
 * POST /api/chat-with-deal
 * Interactive AI chat for deal insights
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { dealId, message, conversationHistory = [] } = req.body;

    if (!dealId) {
      return res.status(400).json({ error: 'dealId is required' });
    }

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    console.log(`💬 Chat with deal ${dealId}: "${message}"`);

    // Build context from all deal data
    const context = await buildDealContext(dealId);
    
    if (!context) {
      return res.status(404).json({ error: 'Deal not found or no data available' });
    }

    console.log(`📊 Deal context built (${context.length} characters)`);

    // Build conversation with context
    const contextPrompt = `Here is all the information about the deal:

${context}

---

Now answer the user's question based on this information.`;

    // Build full prompt with conversation history
    let fullPrompt = contextPrompt;
    
    if (conversationHistory.length > 0) {
      fullPrompt += '\n\nPrevious conversation:\n';
      conversationHistory.forEach((msg: ChatMessage) => {
        fullPrompt += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
    }
    
    fullPrompt += `\n\nUser: ${message}`;

    console.log(`💭 Conversation has ${conversationHistory.length} previous messages`);
    console.log(`🤖 Calling OpenAI...`);

    // Call OpenAI with conversation context
    const response = await generateCompletion({
      systemPrompt: DEAL_CHAT_SYSTEM_PROMPT,
      userPrompt: fullPrompt,
      temperature: 0.7,
      maxTokens: 800,
      model: 'gpt-4o-mini'
    });

    console.log(`✅ AI response generated (${response.length} chars)`);

    return res.json({
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in deal chat:', error);
    
    return res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
