import { supabase, useMockData } from '../lib/supabase';

// Mock deals for testing
const mockDeals = [
  {
    id: '1',
    contact_id: '1',
    name: 'Enterprise License',
    use_case: 'Data Analytics Platform',
    stage: 'negotiating',
    signal: 'positive',
    description: 'Annual enterprise license deal with full support package',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

async function loadDealsByContact({ contactId }: { contactId: string }) {
  console.log('loadDealsByContact called with:', contactId);
  
  if (useMockData) {
    console.log('Using mock deals data');
    return mockDeals.filter(deal => deal.contact_id === contactId);
  }

  const { data, error } = await supabase
    .from('deals')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading deals:', error);
    throw error;
  }

  console.log('Loaded deals:', data);
  return data || [];
}

export default loadDealsByContact;