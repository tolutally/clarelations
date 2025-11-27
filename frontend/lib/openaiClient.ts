import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export interface CompletionOptions {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export async function generateCompletion(options: CompletionOptions): Promise<string> {
  const {
    systemPrompt,
    userPrompt,
    temperature = 0.7,
    maxTokens = 500,
    model = 'gpt-4o-mini' // Much faster and cheaper than gpt-4
  } = options;

  // Check if we should use mock mode (for network issues)
  const useMockMode = process.env.USE_MOCK_AI === 'true';

  if (useMockMode) {
    console.log('🤖 Using MOCK AI mode (network unavailable)');
    return generateMockResponse(userPrompt);
  }

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature,
      max_tokens: maxTokens
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    return content;
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // If network error, suggest using mock mode
    const isNetworkError = error instanceof Error && 
      (error.message.includes('Connection error') || 
       error.message.includes('ECONNRESET') ||
       error.message.includes('fetch failed'));
    
    if (isNetworkError) {
      console.error('⚠️  Network connectivity issue detected.');
      console.error('💡 Tip: Set USE_MOCK_AI=true in .env.local to use mock responses for testing');
    }
    
    if (error instanceof Error) {
      throw new Error(`OpenAI completion failed: ${error.message}`);
    }
    throw new Error('OpenAI completion failed with unknown error');
  }
}

function generateMockResponse(userPrompt: string): string {
  // Detect analysis type from prompt
  if (userPrompt.includes('next best action')) {
    return `**Next Best Action: Schedule Follow-up Call**

**Timing:** Within 2-3 business days

**Rationale:** Based on the contact's recent activity and current relationship stage, a follow-up call would be most effective to:
- Re-engage after recent silence
- Address any outstanding questions
- Move the relationship forward

**Suggested Approach:**
- Reference previous conversation
- Offer value (industry insights, case study)
- Keep it brief (15-20 minutes)

*Note: This is a MOCK response. Enable OpenAI connection for real AI insights.*`;
  }
  
  if (userPrompt.includes('Relationship Health Score')) {
    return `**Relationship Health Score: 7/10**

**Status:** Moderately Strong

**Strengths:**
- Regular communication pattern
- Mutual engagement in conversations
- Potential for growth

**Risks:**
- Recent decrease in activity
- No deals in pipeline currently

**Opportunities:**
- Introduce to other team members
- Share relevant case studies
- Schedule quarterly check-in

*Note: This is a MOCK response. Enable OpenAI connection for real AI insights.*`;
  }
  
  // Contextual research
  return `**Contextual Research & Insights**

**Company Intelligence:**
- Industry trends suggest growth potential
- Recent market positioning shows opportunity

**Conversation Starters:**
- "How are you approaching [current industry challenge]?"
- "I saw [recent company news] - congratulations!"

**Relationship Deepening:**
- Find common professional interests
- Offer introductions to relevant contacts

**Research Recommendations:**
- Review recent company announcements
- Check LinkedIn for team changes

**Strategic Value:**
- Potential for long-term partnership
- Alignment with our core offerings

*Note: This is a MOCK response. Enable OpenAI connection for real AI insights.*`;
}
