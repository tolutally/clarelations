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

async function loadContacts({
  search,
  company,
  status,
  limit,
  offset
}: {
  search?: string;
  company?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  console.log('loadContacts called with:', { search, company, status, limit, offset });
  console.log('useMockData:', useMockData);
  
  // Use mock data if Supabase is not configured
  if (useMockData) {
    console.log('Using mock data...');
    // Combine initial contacts with any newly created ones
    let filtered = [...initialMockContacts, ...mockContactsStore];
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.first_name.toLowerCase().includes(searchLower) ||
        c.last_name.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower)
      );
    }
    if (company) {
      filtered = filtered.filter(c => c.company === company);
    }
    if (status) {
      filtered = filtered.filter(c => c.status === status);
    }
    
    // Sort by most recent first
    filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    
    if (limit) {
      const start = offset || 0;
      filtered = filtered.slice(start, start + limit);
    }
    
    console.log('Returning filtered contacts:', filtered.length);
    return filtered;
  }

  let query = supabase.from('contacts').select('*');

  // Apply filters
  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (company) {
    query = query.eq('company', company);
  }
  if (status) {
    query = query.eq('status', status);
  }

  // Apply sorting and pagination
  query = query.order('updated_at', { ascending: false });
  
  if (limit) {
    query = query.range(offset || 0, (offset || 0) + limit - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error loading contacts:', error);
    throw error;
  }

  return data || [];
}

export default loadContacts;