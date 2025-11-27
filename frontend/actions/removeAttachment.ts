import { supabase, useMockData } from '../lib/supabase';
import { deleteFile } from '../lib/storage';

export type RemoveAttachmentParams = {
  dealId: string;
  attachmentId: string;
};

// Mock storage for when Supabase is not configured - should match addAttachment.ts
const mockAttachmentsStore: Record<string, any[]> = {};

/**
 * Remove an attachment from a deal
 * @param params - The attachment parameters
 */
export async function removeAttachment({ dealId, attachmentId }: RemoveAttachmentParams): Promise<void> {
  console.log('Removing attachment from deal:', { dealId, attachmentId, useMockData });

  if (useMockData) {
    // Mock storage mode
    console.log('Using mock storage for attachment removal');
    
    // Simulate deletion delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Remove from mock storage
    if (mockAttachmentsStore[dealId]) {
      mockAttachmentsStore[dealId] = mockAttachmentsStore[dealId].filter((att: any) => att.id !== attachmentId);
    }
    
    console.log('Mock attachment removed successfully');
    return;
  }

  // Real Supabase storage mode
  // Get current deal attachments
  const { data: deal, error: fetchError } = await supabase
    .from('deals')
    .select('attachments')
    .eq('id', dealId)
    .single();

  if (fetchError) {
    console.error('Error fetching deal attachments:', fetchError);
    throw fetchError;
  }

  const currentAttachments = deal.attachments || [];
  
  // Find the attachment to remove
  const attachmentToRemove = currentAttachments.find((att: any) => att.id === attachmentId);
  if (!attachmentToRemove) {
    throw new Error('Attachment not found');
  }

  // Remove attachment from storage
  try {
    await deleteFile(attachmentToRemove.url);
  } catch (error) {
    console.warn('Error deleting file from storage (continuing anyway):', error);
  }

  // Remove from attachments array
  const updatedAttachments = currentAttachments.filter((att: any) => att.id !== attachmentId);

  // Update deal with new attachments
  const { error } = await supabase
    .from('deals')
    .update({ attachments: updatedAttachments })
    .eq('id', dealId);

  if (error) {
    console.error('Error updating deal attachments:', error);
    throw error;
  }

  console.log('Attachment removed successfully');
}

export default removeAttachment;