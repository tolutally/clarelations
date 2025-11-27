import { supabase } from '../lib/supabase';
import { GmailMessage, GmailThread } from './gmailService';
import gmailService from './gmailService';

export interface ContactUpdateResult {
  action: 'created' | 'updated' | 'skipped';
  contactId?: string;
  reason: string;
}

export class ContactManager {
  /**
   * Process contact from email (only if they replied to our outreach)
   */
  async processContact(
    message: GmailMessage,
    thread: GmailThread
  ): Promise<ContactUpdateResult> {
    // Check if this is a reply
    if (!gmailService.isReply(message)) {
      return {
        action: 'skipped',
        reason: 'Not a reply - initial outreach only',
      };
    }

    // Extract contact info
    const email = gmailService.extractEmail(message.from);
    const name = gmailService.extractName(message.from);

    if (!email || email.includes('noreply') || email.includes('no-reply')) {
      return {
        action: 'skipped',
        reason: 'Invalid or automated email address',
      };
    }

    // Check if contact exists
    const { data: existing } = await supabase
      .from('contacts')
      .select('*')
      .eq('email', email)
      .single();

    if (existing) {
      // Update last contact date
      const updates = {
        last_contacted_at: message.date.toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating contact:', error);
        return {
          action: 'skipped',
          reason: 'Update failed',
        };
      }

      return {
        action: 'updated',
        contactId: existing.id,
        reason: 'Updated last contact date',
      };
    }

    // Create new contact
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ') || '';

    // Try to extract company and position from signature
    const { company, position } = this.extractSignatureInfo(message.body);

    const contactData = {
      first_name: firstName,
      last_name: lastName,
      email,
      company: company || '',
      position: position || '',
      source: 'gmail_reply',
      last_contacted_at: message.date.toISOString(),
    };

    const { data: newContact, error } = await supabase
      .from('contacts')
      .insert(contactData)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating contact:', error);
      return {
        action: 'skipped',
        reason: `Creation failed: ${error.message}`,
      };
    }

    console.log(`✅ Created new contact from reply: ${name} (${email})`);

    return {
      action: 'created',
      contactId: newContact!.id,
      reason: 'New contact from email reply',
    };
  }

  /**
   * Extract company and position from email signature
   */
  private extractSignatureInfo(body: string): { company?: string; position?: string } {
    const result: { company?: string; position?: string } = {};

    // Common signature patterns
    const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
    
    // Look for patterns like:
    // "John Doe"
    // "CEO | Acme Corp"
    // or
    // "John Doe, CEO"
    // "Acme Corporation"
    
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
      const line = lines[i];
      
      // Skip long lines (likely not signature)
      if (line.length > 100) continue;
      
      // Look for position keywords
      const positionKeywords = [
        'CEO', 'CTO', 'CFO', 'COO', 'VP', 'Director', 'Manager', 
        'Head of', 'Lead', 'Engineer', 'Developer', 'Designer',
        'President', 'Founder', 'Co-founder', 'Partner'
      ];
      
      for (const keyword of positionKeywords) {
        if (line.toUpperCase().includes(keyword.toUpperCase())) {
          // Extract position
          const parts = line.split(/[|\-,]/);
          for (const part of parts) {
            if (part.toUpperCase().includes(keyword.toUpperCase())) {
              result.position = part.trim();
              break;
            }
          }
          
          // Try to find company in same line or next line
          if (!result.company) {
            const nextLine = lines[i + 1];
            if (nextLine && nextLine.length < 50 && !nextLine.includes('@')) {
              result.company = nextLine;
            }
          }
          
          break;
        }
      }
      
      if (result.position && result.company) break;
    }

    return result;
  }

  /**
   * Check if email is from a prospect (not internal team)
   */
  isProspectEmail(email: string): boolean {
    // Add your company domain(s) here
    const internalDomains = ['clarivue.io', 'yourdomain.com'];
    
    const domain = email.split('@')[1]?.toLowerCase();
    return !internalDomains.includes(domain);
  }
}

export default new ContactManager();
