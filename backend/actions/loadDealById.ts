import { supabase, useMockData } from '../lib/supabase';

// Mock deal for testing
const mockDeal = {
  id: '1',
  contact_id: '1',
  name: 'Enterprise License',
  use_case: 'Data Analytics Platform',
  stage: 'negotiating',
  signal: 'positive',
  description: 'Annual enterprise license deal with full support package',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  contact_first_name: 'John',
  contact_last_name: 'Doe',
  contact_email: 'john@example.com',
  contact_company: 'Example Corp',
};

async function loadDealById({ dealId }: { dealId: string }) {
  console.log('loadDealById called with:', dealId);
  
  if (useMockData) {
    console.log('Using mock deal data');
    return [mockDeal];
  }

  const { data, error } = await supabase
    .from('deals')
    .select(`
      *,
      contacts:contact_id (
        first_name,
        last_name,
        email,
        company
      )
    `)
    .eq('id', dealId)
    .single();

  if (error) {
    console.error('Error loading deal:', error);
    throw error;
  }

  // Transform the nested contact data to match the expected format
  const dealWithContact = data ? {
    ...data,
    contact_first_name: data.contacts?.first_name || null,
    contact_last_name: data.contacts?.last_name || null,
    contact_email: data.contacts?.email || null,
    contact_company: data.contacts?.company || null,
  } : null;

  console.log('Loaded deal:', dealWithContact);
  return dealWithContact ? [dealWithContact] : [];
}

export default loadDealById;