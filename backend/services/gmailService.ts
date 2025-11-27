import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: Date;
  snippet: string;
  body: string;
  inReplyTo?: string;
  references?: string[];
}

export interface GmailThread {
  id: string;
  messages: GmailMessage[];
  snippet: string;
  subject: string;
}

export class GmailService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
  }

  /**
   * Generate OAuth URL for user authorization
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  /**
   * Set credentials from stored tokens
   */
  setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Fetch recent emails (last 24 hours by default)
   */
  async fetchRecentEmails(afterDate?: Date): Promise<GmailMessage[]> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    
    // Default to last 24 hours
    const date = afterDate || new Date(Date.now() - 24 * 60 * 60 * 1000);
    const query = `after:${Math.floor(date.getTime() / 1000)} -in:spam -in:trash`;

    try {
      // List message IDs
      const listResponse = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 100,
      });

      if (!listResponse.data.messages || listResponse.data.messages.length === 0) {
        console.log('📭 No new emails found');
        return [];
      }

      console.log(`📬 Found ${listResponse.data.messages.length} emails to process`);

      // Fetch full message details
      const messages: GmailMessage[] = [];
      for (const msg of listResponse.data.messages) {
        if (!msg.id) continue;

        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full',
        });

        const parsed = this.parseMessage(fullMessage.data);
        if (parsed) {
          messages.push(parsed);
        }
      }

      return messages;
    } catch (error) {
      console.error('❌ Error fetching emails:', error);
      throw error;
    }
  }

  /**
   * Fetch email thread by ID
   */
  async fetchThread(threadId: string): Promise<GmailThread | null> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    try {
      const thread = await gmail.users.threads.get({
        userId: 'me',
        id: threadId,
        format: 'full',
      });

      if (!thread.data.messages || thread.data.messages.length === 0) {
        return null;
      }

      const messages = thread.data.messages
        .map(msg => this.parseMessage(msg))
        .filter(Boolean) as GmailMessage[];

      const firstMessage = messages[0];

      return {
        id: threadId,
        messages,
        snippet: thread.data.snippet || '',
        subject: firstMessage?.subject || 'No subject',
      };
    } catch (error) {
      console.error(`❌ Error fetching thread ${threadId}:`, error);
      return null;
    }
  }

  /**
   * Parse Gmail message into our format
   */
  private parseMessage(message: any): GmailMessage | null {
    if (!message.id || !message.payload) return null;

    const headers = message.payload.headers || [];
    const getHeader = (name: string) => 
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    const subject = getHeader('subject');
    const from = getHeader('from');
    const to = getHeader('to');
    const dateStr = getHeader('date');
    const inReplyTo = getHeader('in-reply-to');
    const referencesStr = getHeader('references');

    const body = this.extractBody(message.payload);
    const snippet = message.snippet || '';

    return {
      id: message.id,
      threadId: message.threadId || message.id,
      subject,
      from,
      to,
      date: dateStr ? new Date(dateStr) : new Date(),
      snippet,
      body,
      inReplyTo: inReplyTo || undefined,
      references: referencesStr ? referencesStr.split(/\s+/) : [],
    };
  }

  /**
   * Extract email body from message payload
   */
  private extractBody(payload: any): string {
    let body = '';

    // Check for plain text in body.data
    if (payload.body?.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    // Check for multipart
    if (payload.parts && payload.parts.length > 0) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        }
        // Recursively check nested parts
        if (part.parts) {
          const nestedBody = this.extractBody(part);
          if (nestedBody) {
            body = nestedBody;
            break;
          }
        }
      }
    }

    return body;
  }

  /**
   * Check if email is a reply (has In-Reply-To header)
   */
  isReply(message: GmailMessage): boolean {
    return !!(message.inReplyTo || (message.references && message.references.length > 0));
  }

  /**
   * Extract email address from "Name <email@example.com>" format
   */
  extractEmail(emailString: string): string {
    const match = emailString.match(/<(.+?)>/);
    return match ? match[1] : emailString.trim();
  }

  /**
   * Extract name from "Name <email@example.com>" format
   */
  extractName(emailString: string): string {
    const match = emailString.match(/^(.+?)\s*</);
    if (match) {
      return match[1].replace(/['"]/g, '').trim();
    }
    return emailString.split('@')[0];
  }
}

export default new GmailService();
