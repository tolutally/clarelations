import { generateCompletion } from '../../lib/openaiClient';
import type { EmailThread, DealExtractionResult } from '../types/gmail';

const DEAL_ANALYSIS_PROMPT = `You are an expert sales email analyzer. Analyze this email thread and determine if it represents a legitimate sales opportunity.

Score the conversation on a 0-10 scale based on:
- Deal signals (pricing, contracts, meetings, budget discussions)
- Engagement quality (responses, questions, interest level)
- Decision maker involvement
- Timeline and urgency indicators
- Spam/automated email indicators (SUBTRACT points)

**Confidence Scoring:**
- 9-10: Clear deal with pricing/contract discussions, decision maker engaged
- 7-8: Strong interest, multiple replies, concrete next steps
- 5-6: Initial interest but unclear, needs more qualification
- 3-4: Cold outreach with minimal engagement
- 0-2: Spam, automated, or completely irrelevant

Return ONLY valid JSON (no markdown, no code blocks):
{
  "confidence": <number 0-10>,
  "shouldCreate": <boolean, true if >8>,
  "requiresReview": <boolean, true if 6-8>,
  "dealData": {
    "name": "<Company Name - Product/Service>",
    "company": "<Company Name>",
    "value": <estimated deal value in USD, or null>,
    "stage": "new" | "qualified" | "negotiating",
    "description": "<1-2 sentence deal context>",
    "useCase": "<their specific use case or need>"
  },
  "contactData": {
    "email": "<contact email>",
    "firstName": "<first name>",
    "lastName": "<last name>",
    "company": "<company>",
    "position": "<job title or null>"
  },
  "summary": "<2-3 sentence summary of key conversation points for notes>",
  "signals": {
    "hasPricingDiscussion": <boolean>,
    "hasMeetingRequest": <boolean>,
    "hasContractMention": <boolean>,
    "hasDecisionMaker": <boolean>,
    "responseRate": <0-1, ratio of replies to messages>
  },
  "rejectionReason": "<if confidence <6, explain why in 1 sentence>"
}`;

export async function analyzeEmailThread(thread: EmailThread): Promise<DealExtractionResult> {
  console.log(`📧 Analyzing email thread: ${thread.subject}`);
  
  try {
    // Build context from email thread
    const context = buildEmailContext(thread);
    
    // Check for obvious spam/automated patterns first
    if (isSpamOrAutomated(thread)) {
      return {
        confidence: 0,
        shouldCreate: false,
        requiresReview: false,
        contactData: {
          email: thread.participantEmails[0] || '',
          firstName: '',
          lastName: '',
          company: '',
        },
        summary: '',
        signals: {
          hasPricingDiscussion: false,
          hasMeetingRequest: false,
          hasContractMention: false,
          hasDecisionMaker: false,
          responseRate: 0,
        },
        rejectionReason: 'Detected as spam or automated email',
      };
    }
    
    // Get AI analysis
    const response = await generateCompletion({
      systemPrompt: DEAL_ANALYSIS_PROMPT,
      userPrompt: `Analyze this email thread:\n\n${context}`,
      temperature: 0.3,
      maxTokens: 800,
    });
    
    // Parse response
    const analysis = parseAnalysisResponse(response);
    
    console.log(`✅ Analysis complete. Confidence: ${analysis.confidence}/10`);
    console.log(`   Should create: ${analysis.shouldCreate}, Requires review: ${analysis.requiresReview}`);
    
    return analysis;
  } catch (error) {
    console.error('❌ Error analyzing email thread:', error);
    throw error;
  }
}

function buildEmailContext(thread: EmailThread): string {
  let context = `Subject: ${thread.subject}\n`;
  context += `Total Messages: ${thread.messages.length}\n`;
  context += `Participants: ${thread.participantEmails.join(', ')}\n`;
  context += `Last Message: ${thread.lastMessageDate.toISOString()}\n\n`;
  context += `--- Email Thread ---\n\n`;
  
  thread.messages.forEach((msg, idx) => {
    context += `Message ${idx + 1} (${msg.date.toISOString()}):\n`;
    context += `From: ${msg.from}\n`;
    context += `To: ${msg.to.join(', ')}\n`;
    if (msg.cc && msg.cc.length > 0) {
      context += `CC: ${msg.cc.join(', ')}\n`;
    }
    context += `\n${msg.body.substring(0, 2000)}\n`; // Limit body length
    context += `\n---\n\n`;
  });
  
  return context;
}

function isSpamOrAutomated(thread: EmailThread): boolean {
  const subject = thread.subject.toLowerCase();
  const firstMessage = thread.messages[0];
  const body = firstMessage?.body.toLowerCase() || '';
  
  // Spam indicators
  const spamKeywords = [
    'unsubscribe',
    'newsletter',
    'notification',
    'no-reply',
    'noreply',
    'donotreply',
    'automated',
    'auto-reply',
    'out of office',
    'delivery failure',
    'mailer-daemon',
  ];
  
  // Check subject and body for spam keywords
  const hasSpamKeywords = spamKeywords.some(keyword => 
    subject.includes(keyword) || body.includes(keyword)
  );
  
  // Check for automated sender patterns
  const automatedSenders = ['no-reply', 'noreply', 'donotreply', 'notifications', 'automated'];
  const hasAutomatedSender = automatedSenders.some(pattern => 
    firstMessage?.from.toLowerCase().includes(pattern)
  );
  
  // Single message threads with no reply are usually automated
  const isSingleMessageNoReply = thread.messages.length === 1 && 
    !thread.messages.some(m => m.inReplyTo);
  
  return hasSpamKeywords || hasAutomatedSender || 
    (isSingleMessageNoReply && body.includes('unsubscribe'));
}

function parseAnalysisResponse(response: string): DealExtractionResult {
  try {
    // Try to parse as JSON first
    const cleaned = response.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const analysis = JSON.parse(cleaned);
    
    // Validate and apply business rules
    analysis.shouldCreate = analysis.confidence > 8;
    analysis.requiresReview = analysis.confidence >= 6 && analysis.confidence <= 8;
    
    return analysis;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.log('Raw response:', response);
    
    // Fallback to manual review
    return {
      confidence: 6,
      shouldCreate: false,
      requiresReview: true,
      contactData: {
        email: '',
        firstName: '',
        lastName: '',
        company: '',
      },
      summary: 'Failed to parse analysis. Manual review required.',
      signals: {
        hasPricingDiscussion: false,
        hasMeetingRequest: false,
        hasContractMention: false,
        hasDecisionMaker: false,
        responseRate: 0,
      },
    };
  }
}

export function extractContactFromThread(thread: EmailThread): {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  position?: string;
  hasReplied: boolean;
} | null {
  // Find the contact (not the sender/our team)
  const ourDomain = 'clarivue.io'; // TODO: Make configurable
  
  // Get all external participants
  const externalEmails = thread.participantEmails.filter(
    email => !email.toLowerCase().includes(ourDomain)
  );
  
  if (externalEmails.length === 0) return null;
  
  // Check if they replied (look for messages FROM external email)
  const hasReplied = thread.messages.some(msg => 
    externalEmails.some(email => msg.from.toLowerCase().includes(email.toLowerCase()))
  );
  
  // Only process contacts who have replied
  if (!hasReplied) return null;
  
  // Get the most recent message from the contact
  const contactMessage = thread.messages
    .filter(msg => externalEmails.some(email => 
      msg.from.toLowerCase().includes(email.toLowerCase())
    ))
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  
  if (!contactMessage) return null;
  
  // Extract name from "Name <email>" format
  const fromParts = contactMessage.from.match(/(.+?)\s*<(.+?)>/);
  const name = fromParts ? fromParts[1].trim() : '';
  const email = fromParts ? fromParts[2].trim() : contactMessage.from;
  
  // Split name into first/last
  const nameParts = name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  // Try to extract company from email domain
  const emailDomain = email.split('@')[1] || '';
  const company = emailDomain.split('.')[0] || '';
  
  // Try to extract position from signature
  const position = extractPositionFromBody(contactMessage.body);
  
  return {
    email,
    firstName,
    lastName,
    company: company.charAt(0).toUpperCase() + company.slice(1),
    position,
    hasReplied: true,
  };
}

function extractPositionFromBody(body: string): string | undefined {
  // Look for common title patterns in signature
  const titlePatterns = [
    /\b(CEO|CTO|CFO|COO|VP|Director|Manager|Head|Lead|Engineer|Developer|Designer)\b/i,
  ];
  
  for (const pattern of titlePatterns) {
    const match = body.match(pattern);
    if (match) return match[0];
  }
  
  return undefined;
}
