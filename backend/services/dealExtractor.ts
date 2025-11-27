import { supabase } from '../../lib/supabase';
import type { DealExtractionResult } from '../types/gmail';
import { GmailThread } from './gmailService';

export interface DealProcessResult {
  action: 'created' | 'updated' | 'matched' | 'pending_review' | 'rejected';
  dealId?: string;
  confidence: number;
  reason: string;
}

export class DealExtractor {
  /**
   * Process analyzed email and create/update deals
   */
  async processDeal(
    thread: GmailThread,
    analysis: DealExtractionResult
  ): Promise<DealExtractionResult> {
    console.log(`💼 Processing deal from thread: ${thread.subject}`);
    console.log(`Confidence: ${analysis.confidence}`);

    // Reject low confidence (confidence < 6)
    if (analysis.confidence < 6) {
      return {
        ...analysis,
        shouldCreate: false,
        requiresReview: false,
        rejectionReason: analysis.rejectionReason || 'Low confidence score',
      };
    }

    // Manual review queue (confidence 6-8)
    if (analysis.requiresReview) {
      await this.queueForManualReview(thread, analysis);
      return analysis;
    }

    // Try to match existing deal
    const existingDeal = await this.findMatchingDeal(thread, analysis);
    
    if (existingDeal) {
      // Add note to existing deal
      await this.addNoteToDeal(existingDeal.id, thread, analysis);
      
      return analysis;
    }

    // Create new deal (auto-approve, confidence >= 8)
    if (analysis.shouldCreate) {
      await this.createDeal(thread, analysis);
      
      return analysis;
    }

    return analysis;
  }

  /**
   * Find existing deal that matches this email thread
   */
  private async findMatchingDeal(
    thread: GmailThread,
    analysis: DealExtractionResult
  ): Promise<any | null> {
    try {
      // Try to match by contact email
      const contactEmail = analysis.contactData.email;
      if (!contactEmail) return null;

      // Find contact first
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', contactEmail)
        .limit(1);

      if (!contacts || contacts.length === 0) return null;

      const contactId = contacts[0].id;

      // Find active deals for this contact
      const { data: deals } = await supabase
        .from('deals')
        .select('*')
        .eq('contact_id', contactId)
        .in('stage', ['new', 'qualified', 'negotiating'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (deals && deals.length > 0) {
        console.log(`✅ Found matching deal: ${deals[0].name}`);
        return deals[0];
      }

      return null;
    } catch (error) {
      console.error('Error finding matching deal:', error);
      return null;
    }
  }

  /**
   * Create new deal from email analysis
   */
  private async createDeal(
    thread: GmailThread,
    analysis: DealExtractionResult
  ): Promise<string> {
    const { dealData, contactData } = analysis;

    // First, ensure contact exists
    let contactId: string | null = null;

    if (contactData.email) {
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', contactData.email)
        .single();

      if (existingContact) {
        contactId = existingContact.id;
      } else {
        // Create new contact
        const { data: newContact, error: contactError } = await supabase
          .from('contacts')
          .insert({
            first_name: contactData.firstName || '',
            last_name: contactData.lastName || '',
            email: contactData.email,
            company: contactData.company || '',
            position: contactData.position || '',
          })
          .select('id')
          .single();

        if (!contactError && newContact) {
          contactId = newContact.id;
          console.log(`✅ Created new contact: ${contactData.firstName} ${contactData.lastName}`);
        }
      }
    }

    // Create deal
    const dealName = dealData?.name || thread.subject.substring(0, 100);

    const dealDataToInsert = {
      name: dealName,
      contact_id: contactId,
      value: dealData?.value || 0,
      stage: dealData?.stage || 'new',
      use_case: dealData?.useCase || '',
      description: dealData?.description || analysis.summary,
      signal: 'neutral' as const,
      source: 'gmail_auto_extract',
    };

    const { data: deal, error } = await supabase
      .from('deals')
      .insert(dealDataToInsert)
      .select('id')
      .single();

    if (error) {
      console.error('❌ Error creating deal:', error);
      throw new Error(`Failed to create deal: ${error.message}`);
    }

    console.log(`✅ Created new deal: ${dealName}`);

    // Add initial note with email summary
    if (deal) {
      await this.addNoteToDeal(deal.id, thread, analysis);
    }

    return deal!.id;
  }

  /**
   * Add email summary as note to existing deal
   */
  private async addNoteToDeal(
    dealId: string,
    thread: GmailThread,
    analysis: DealExtractionResult
  ): Promise<void> {
    try {
      const lastMessage = thread.messages[thread.messages.length - 1];
      const noteContent = `📧 Email from ${analysis.contactData.firstName || 'contact'} ${analysis.contactData.lastName || ''} (${lastMessage.date.toLocaleDateString()}):\n\n${analysis.summary}\n\nSubject: ${thread.subject}`;

      const { error } = await supabase
        .from('deal_notes')
        .insert({
          deal_id: dealId,
          content: noteContent,
          source: 'gmail_auto',
        });

      if (error) {
        console.error('Error adding note to deal:', error);
      } else {
        console.log(`✅ Added note to deal ${dealId}`);
      }
    } catch (error) {
      console.error('Error adding note:', error);
    }
  }

  /**
   * Queue email for manual review
   */
  private async queueForManualReview(
    thread: GmailThread,
    analysis: DealExtractionResult
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('gmail_review_queue')
        .insert({
          thread_id: thread.id,
          subject: thread.subject,
          confidence_score: analysis.confidence,
          analysis: JSON.stringify(analysis),
          status: 'pending',
        });

      if (error) {
        console.error('Error queuing for review:', error);
      } else {
        console.log(`✅ Queued thread for manual review: ${thread.subject}`);
      }
    } catch (error) {
      console.error('Error queuing for review:', error);
    }
  }
}

export default new DealExtractor();
