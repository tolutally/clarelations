import { buildDealContext } from './buildDealContext';
import { generateCompletion } from './openaiClient';
import { supabase } from './supabase';

const SIGNAL_ANALYSIS_PROMPT = `You are an expert sales analyst. Analyze the deal information provided and determine the overall signal/health of this deal.

Provide a DETAILED, SPECIFIC analysis that clearly explains your signal determination. Your analysis must include concrete evidence and specific examples from the deal data.

Structure your analysis in 3-5 paragraphs covering:

**Paragraph 1 - Signal Summary & Key Evidence:**
Start with a clear statement of the signal (Positive/Neutral/Negative) and immediately cite 2-3 specific, concrete pieces of evidence that led to this determination. Reference actual dates, activity types, contact names, and specific events from the deal history.

**Paragraph 2 - Engagement & Activity Analysis:**
Provide specific details about interaction patterns:
- Exact number and types of recent activities (e.g., "3 calls in the past 2 weeks")
- Specific dates of key interactions
- Quality indicators (response times, meeting attendance, email replies)
- Compare to typical patterns (e.g., "60% increase in engagement vs. previous month")

**Paragraph 3 - Buying Signals & Deal Progression:**
Identify specific behaviors and milestones:
- Concrete buying signals observed (e.g., "Requested pricing on [date]", "Introduced to executive team")
- Deal stage changes and timeline (e.g., "Moved from Qualified to Negotiating in 14 days")
- Specific commitments made or next steps agreed upon
- Budget discussions, timeline commitments, or stakeholder involvement

**Paragraph 4 - Risk Factors & Concerns (if any):**
Highlight specific concerns with evidence:
- Exact gaps in communication (e.g., "No response to 2 emails sent on [dates]")
- Specific objections raised or concerns mentioned
- Timeline slippages with dates
- Any competitive threats or budget constraints mentioned

**Paragraph 5 - Recommended Actions:**
Provide 2-3 specific, actionable next steps with reasoning based on the analysis above.

Return a JSON response with this EXACT structure (no markdown, no code blocks):
{
  "signal": "positive" | "neutral" | "negative",
  "rationale": "Your 3-5 paragraph detailed analysis with specific evidence, dates, and concrete examples from the deal context"
}

CRITICAL RULES:
- "positive": Active engagement (cite frequency), clear buying signals (cite specific examples), progressing (cite stage/timeline), no major red flags
- "neutral": Moderate engagement (cite metrics), mixed signals (cite examples), unclear direction (explain why), needs more data (specify what)
- "negative": Low engagement (cite gaps), disengagement indicators (cite examples), stalled (cite duration), significant concerns (cite specific issues)

Be SPECIFIC. Replace vague statements like "good engagement" with "4 calls and 6 emails over the past 10 days". Replace "showing interest" with "requested detailed pricing breakdown on Nov 10 and scheduled technical review for Nov 15".

Every claim must be backed by specific evidence from the deal data.`;

export interface SignalAnalysisResult {
  signal: 'positive' | 'neutral' | 'negative';
  rationale: string;
}

/**
 * Analyzes a deal and updates its signal based on AI analysis of all available context
 */
export async function analyzeAndUpdateDealSignal(dealId: string): Promise<SignalAnalysisResult> {
  console.log(`🎯 Analyzing signal for deal: ${dealId}`);
  
  try {
    // Build comprehensive deal context
    const context = await buildDealContext(dealId);
    console.log(`📊 Deal context built (${context.length} characters)`);
    
    // Get AI analysis
    const response = await generateCompletion({
      systemPrompt: SIGNAL_ANALYSIS_PROMPT,
      userPrompt: `Analyze this deal and determine its signal:\n\n${context}`,
      temperature: 0.3, // Lower temperature for more consistent analysis
      maxTokens: 800, // Increased for detailed analysis
    });
    
    console.log(`🤖 AI response: ${response}`);
    
    // Parse the response
    let analysis: SignalAnalysisResult;
    try {
      // Try to parse as JSON first
      analysis = JSON.parse(response.trim());
      
      // Validate the structure
      if (!analysis.signal || !analysis.rationale) {
        throw new Error('Invalid response structure');
      }
      
      // Validate signal value
      if (!['positive', 'neutral', 'negative'].includes(analysis.signal)) {
        throw new Error(`Invalid signal value: ${analysis.signal}`);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      console.log('Raw response:', response);
      
      // Fallback: extract signal and rationale with regex
      const signalMatch = response.match(/"signal":\s*"(positive|neutral|negative)"/);
      const rationaleMatch = response.match(/"rationale":\s*"([^"]+)"/);
      
      if (signalMatch && rationaleMatch) {
        analysis = {
          signal: signalMatch[1] as 'positive' | 'neutral' | 'negative',
          rationale: rationaleMatch[1],
        };
      } else {
        // Ultimate fallback
        analysis = {
          signal: 'neutral',
          rationale: 'Unable to fully analyze deal signal. Please review manually.',
        };
      }
    }
    
    console.log(`✅ Signal determined: ${analysis.signal} - ${analysis.rationale}`);
    
    // Update the deal in the database
    const { error } = await supabase
      .from('deals')
      .update({
        signal: analysis.signal,
        signal_rationale: analysis.rationale,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dealId);
    
    if (error) {
      console.error('❌ Error updating deal signal:', error);
      throw new Error(`Failed to update deal signal: ${error.message}`);
    }
    
    console.log(`✅ Deal signal updated in database`);
    
    return analysis;
  } catch (error) {
    console.error('❌ Error analyzing deal signal:', error);
    throw error;
  }
}
