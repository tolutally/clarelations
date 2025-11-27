import { supabase, useMockData } from '../lib/supabase';

// Mock activities for testing
const mockActivities = [
  {
    id: '1',
    contact_id: null,
    deal_id: '1',
    type: 'note',
    title: 'Follow-up call scheduled',
    description: 'Scheduled follow-up call for next week to discuss proposal',
    created_at: new Date().toISOString(),
    created_by: null,
  },
];

async function loadDealActivities({ dealId }: { dealId: string }) {
  console.log('loadDealActivities called with dealId:', dealId);
  
  if (useMockData) {
    console.log('Using mock activities data');
    return mockActivities.filter(activity => activity.deal_id === dealId);
  }

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading deal activities:', error);
    throw error;
  }

  console.log('Loaded deal activities:', data);
  return data || [];
}

export default loadDealActivities;