export const SYSTEM_PROMPT = `You are an AI Relationship Manager assistant for a CRM system. 
Your role is to analyze customer data (contacts, deals, activities, call transcripts) and provide actionable insights.
Be concise, professional, and data-driven in your analysis.
Focus on relationship health, deal risk factors, and recommended next actions.`;

export function buildRelationshipHealthPrompt(context: string): string {
  return `${context}

Based on this contact's history, analyze their relationship health.
Consider: activity frequency, deal progress, response patterns, and engagement level.
Provide a brief assessment (2-3 sentences) and rate the relationship health as: Strong, Good, Fair, or At Risk.`;
}

export function buildDealRiskPrompt(context: string): string {
  return `${context}

Analyze this deal for risk factors.
Consider: deal stage duration, activity patterns, contact engagement, and deal size vs progress.
Provide a risk assessment (2-3 sentences) and rate the risk level as: Low, Medium, or High.`;
}

export function buildNextActionPrompt(context: string): string {
  return `${context}

Based on the contact's recent activity and deal status, recommend the next best action.
Be specific and actionable (1-2 sentences).
Focus on what would most effectively move the relationship or deal forward.`;
}

export function buildContextualResearchPrompt(context: string): string {
  return `${context}

Based on this contact's information, provide comprehensive contextual research focused on professional background and personal context:

1. **Company Research:**
   - Key background about their company (industry, size, stage, business model)
   - Recent company news, initiatives, or market position
   - Industry trends or challenges affecting their business
   - What decision-makers in their company typically care about

2. **Professional Background:**
   - Career trajectory and work experience highlights
   - Education and professional qualifications
   - Role responsibilities and typical priorities for their position
   - Professional achievements or notable projects (if mentioned)

3. **Personal Context & Interests:**
   - Publicly shared interests, hobbies, or passions
   - Professional goals or career aspirations (if indicated)
   - Personal values or causes they care about
   - Communication style and preferences (based on interactions)

4. **Conversation Starters:**
   - Relevant topics based on their background and interests
   - Industry news or events they might find valuable
   - Questions that show you understand their role and challenges
   - Personal touchpoints that could build rapport

5. **Strategic Engagement:**
   - How to position value based on their goals and challenges
   - Topics that align with their interests and professional needs
   - Ways to deepen the relationship authentically
   - Next steps for meaningful follow-up

Focus on information that helps build genuine, personalized connections. Reference specific details from their profile and interaction history.`;
}

export function buildCallAnalysisPrompt(transcript: string, summary?: string): string {
  const contextParts = [
    summary ? `Call Summary: ${summary}` : '',
    `Full Transcript:\n${transcript}`
  ].filter(Boolean);

  return `${contextParts.join('\n\n')}

Analyze this sales call and provide:
1. Key Topics Discussed (bullet points)
2. Customer Sentiment (Positive/Neutral/Negative with brief reason)
3. Action Items (what needs to be done next)
4. Red Flags (any concerns or objections)

Keep your analysis concise and actionable.`;
}
