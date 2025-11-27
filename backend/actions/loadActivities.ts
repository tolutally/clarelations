import { supabase, useMockData } from '../lib/supabase';

// Mock activities for testing
const mockActivities = [
  {
    id: '1',
    contact_id: '1',
    deal_id: null,
    type: 'note',
    title: 'Initial contact',
    description: 'Had a great conversation about their needs.',
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    created_by: 'John Admin',
  },
  {
    id: '2',
    contact_id: '1',
    deal_id: null,
    type: 'call',
    title: 'Follow-up call',
    description: 'Discussed pricing and timeline.',
    created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    created_by: 'John Admin',
  },
];

async function loadActivities({ contactId }: { contactId: string }) {
  console.log('loadActivities called with:', contactId);
  
  if (useMockData) {
    console.log('Using mock activities data');
    return mockActivities.filter(activity => activity.contact_id === contactId);
  }

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading activities:', error);
    throw error;
  }

  console.log('Loaded activities:', data);
  return data || [];
}

export default loadActivities;