import { supabase, useMockData } from '../lib/supabase';
import { mockContactsStore } from './createContact';

// Initial mock data for testing without Supabase
const initialMockContacts = [
  {
    id: '1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@acme.com',
    phone: '+1 (555) 123-4567',
    company: 'Acme Corp',
    position: 'CEO',
    linkedin: 'linkedin.com/in/johndoe',
    acquisition_channel: 'referral',
    status: 'active',
    tags: ['vip', 'enterprise'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@techstart.io',
    phone: '+1 (555) 987-6543',
    company: 'TechStart',
    position: 'CTO',
    linkedin: 'linkedin.com/in/janesmith',
    acquisition_channel: 'linkedin',
    status: 'active',
    tags: ['customer'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    first_name: 'Bob',
    last_name: 'Johnson',
    email: 'bob@innovate.com',
    phone: '+1 (555) 456-7890',
    company: 'Innovate Inc',
    position: 'VP Sales',
    linkedin: null,
    acquisition_channel: 'website',
    status: 'active',
    tags: ['prospect'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

async function loadContactById({ contactId }: { contactId: string }) {
  console.log('loadContactById called with:', contactId);
  
  if (useMockData) {
    console.log('Using mock data for contact');
    const allContacts = [...initialMockContacts, ...mockContactsStore];
    const contact = allContacts.find(c => c.id === contactId);
    console.log('Found contact:', contact);
    return contact || null;
  }

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  if (error) {
    console.error('Error loading contact:', error);
    throw error;
  }

  console.log('Loaded contact from Supabase:', data);
  return data;
}

export default loadContactById;