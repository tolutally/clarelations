import { supabase, useMockData } from '../lib/supabase';

export type DeleteContactParams = {
  contactId: string;
};

// Mock storage for when Supabase is not configured
let mockContactsDeleted: string[] = [];

/**
 * Delete a contact
 * @param params - The contact ID to delete
 */
export async function deleteContact({ contactId }: DeleteContactParams): Promise<void> {
  console.log('Deleting contact:', { contactId, useMockData });

  if (useMockData) {
    console.log('Using mock data for contact deletion');
    mockContactsDeleted.push(contactId);
    return;
  }

  // Real Supabase mode - delete from database
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId);

  if (error) {
    console.error('Error deleting contact:', error);
    throw error;
  }

  console.log('Contact deleted successfully');
}

export default deleteContact;
