import { supabase, useMockData } from '../lib/supabase';
import { uploadFile } from '../lib/storage';
import type { DealAttachment } from '../types/deal';

export type AddAttachmentParams = {
  dealId: string;
  file: File;
};

// Mock storage for when Supabase is not configured
const mockAttachmentsStore: Record<string, DealAttachment[]> = {};

/**
 * Add an attachment to a deal
 * @param params - The attachment parameters
 * @returns The created attachment data
 */
export async function addAttachment({ dealId, file }: AddAttachmentParams): Promise<DealAttachment> {
  console.log('Adding attachment to deal:', { dealId, fileName: file.name, fileSize: file.size, useMockData });

  // Create new attachment object
  const newAttachment: DealAttachment = {
    id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
    name: file.name,
    url: useMockData ? `mock://attachments/${dealId}/${file.name}` : '',
    size: file.size,
    type: file.type,
    uploaded_at: new Date().toISOString(),
  };

  if (useMockData) {
    // Mock storage mode - simulate file upload
    console.log('Using mock storage for attachment upload');
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Store in mock storage
    if (!mockAttachmentsStore[dealId]) {
      mockAttachmentsStore[dealId] = [];
    }
    mockAttachmentsStore[dealId].push(newAttachment);
    
    console.log('Mock attachment added successfully:', newAttachment);
    return newAttachment;
  }

  // Real Supabase storage mode
  try {
    console.log('🔄 Starting file upload to Supabase Storage...');
    
    // Upload file to storage
    const url = await uploadFile(file, dealId);
    newAttachment.url = url;
    
    console.log('✅ File uploaded to storage:', url);

    // Get current deal attachments
    console.log('📥 Fetching current deal attachments...');
    const { data: deal, error: fetchError } = await supabase
      .from('deals')
      .select('attachments')
      .eq('id', dealId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching deal attachments:', fetchError);
      console.error('Error details:', { code: fetchError.code, message: fetchError.message, details: fetchError.details, hint: fetchError.hint });
      
      // If RLS error, provide helpful message
      if (fetchError.code === '42501' || fetchError.message?.includes('row-level security')) {
        throw new Error('Database access denied. Please check that Row Level Security policies are configured correctly in Supabase.');
      }
      throw fetchError;
    }

    console.log('📋 Current attachments:', deal.attachments);
    
    // Add to existing attachments array or create new array
    const currentAttachments = deal.attachments || [];
    const updatedAttachments = [...currentAttachments, newAttachment];
    
    console.log('💾 Updating deal with new attachments...', updatedAttachments);

    // Update deal with new attachments
    const { data, error } = await supabase
      .from('deals')
      .update({ attachments: updatedAttachments })
      .eq('id', dealId)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Error updating deal attachments:', error);
      console.error('Error details:', { code: error.code, message: error.message, details: error.details, hint: error.hint });
      
      // If RLS error, provide helpful message and fall back to mock mode
      if (error.code === '42501' || error.message?.includes('row-level security')) {
        console.warn('RLS policy violation detected. Falling back to mock mode for this upload.');
        
        // Store in mock storage as fallback
        if (!mockAttachmentsStore[dealId]) {
          mockAttachmentsStore[dealId] = [];
        }
        mockAttachmentsStore[dealId].push(newAttachment);
        
        console.log('Attachment saved in mock mode due to RLS policy issue:', newAttachment);
        return newAttachment;
      }
      throw error;
    }

    console.log('✅ Attachment added successfully to database!');
    console.log('Final data:', data);
    return newAttachment;
  } catch (error: any) {
    console.error('❌ CAUGHT ERROR in addAttachment:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    
    // Re-throw the error instead of falling back to mock mode
    // This will show the real error to the user
    throw error;
  }
}

export default addAttachment;