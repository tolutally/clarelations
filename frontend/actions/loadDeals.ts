import { supabase, useMockData } from '../lib/supabase';

// Mock deals for testing - exported so createDeal can add to it
export const mockDeals = [
  {
    id: '1',
    contact_id: '1',
    name: 'Enterprise License',
    use_case: 'Data Analytics Platform',
    stage: 'negotiating',
    signal: 'positive',
    description: 'Annual enterprise license deal with full support package',
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    contact_first_name: 'John',
    contact_last_name: 'Doe',
    contact_email: 'john.doe@acme.com',
    contact_company: 'Acme Corp',
  },
  {
    id: '2',
    contact_id: '2',
    name: 'Consulting Package',
    use_case: 'Process Automation',
    stage: 'qualified',
    signal: 'neutral',
    description: '6-month consulting engagement for workflow optimization',
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    contact_first_name: 'Jane',
    contact_last_name: 'Smith',
    contact_email: 'jane.smith@techstart.io',
    contact_company: 'TechStart',
  },
  {
    id: '3',
    contact_id: '3',
    name: 'Software Implementation',
    use_case: 'Customer Portal',
    stage: 'new',
    signal: 'positive',
    description: 'Custom software implementation project for customer self-service',
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    contact_first_name: 'Bob',
    contact_last_name: 'Johnson',
    contact_email: 'bob@innovate.com',
    contact_company: 'Innovate Inc',
  },
];

async function loadDeals() {
  console.log('loadDeals called');
  
  if (useMockData) {
    console.log('Using mock deals data. Total deals:', mockDeals.length);
    console.log('Mock deals:', mockDeals);
    return mockDeals;
  }

  console.log('Loading deals from Supabase...');

  const { data, error } = await supabase
    .from('deals')
    .select(`
      *,
      contacts (
        first_name,
        last_name,
        email,
        company
      )
    `)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error loading deals:', error);
    throw error;
  }

  console.log('Raw data from Supabase:', data);

  // Transform the data to match expected format
  const transformedData = data?.map((deal: any) => ({
    ...deal,
    contact_first_name: deal.contacts?.first_name || '',
    contact_last_name: deal.contacts?.last_name || '',
    contact_email: deal.contacts?.email || '',
    contact_company: deal.contacts?.company || '',
  }));

  console.log('Loaded deals:', transformedData);
  return transformedData || [];
}

export default loadDeals;