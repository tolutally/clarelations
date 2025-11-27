import { supabase, useMockData } from '../lib/supabase';
import { mockContactsStore } from './createContact';

async function countContacts(params: {
  search?: string;
  company?: string;
  status?: string;
}) {
  // Use mock data if Supabase is not configured
  if (useMockData) {
    // Return count of initial contacts (3) plus any created contacts
    return [{ total: 3 + mockContactsStore.length }];
  }

  let query = supabase.from('contacts').select('*', { count: 'exact', head: true });

  // Apply filters
  if (params.search) {
    query = query.or(`first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
  }
  if (params.company) {
    query = query.eq('company', params.company);
  }
  if (params.status) {
    query = query.eq('status', params.status);
  }

  const { count, error } = await query;

  if (error) {
    console.error('Error counting contacts:', error);
    throw error;
  }

  return [{ total: count || 0 }];
}

export default countContacts;