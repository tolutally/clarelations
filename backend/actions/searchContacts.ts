import { supabase } from '../lib/supabase';

async function searchContacts({ 
  searchQuery 
}: { 
  searchQuery?: string;
}) {
  let query = supabase
    .from('contacts')
    .select('id, first_name, last_name, email, company, linkedin, acquisition_channel, status')
    .order('first_name')
    .order('last_name')
    .limit(50);

  if (searchQuery && searchQuery.trim()) {
    const search = `%${searchQuery.trim()}%`;
    query = query.or(`first_name.ilike.${search},last_name.ilike.${search},email.ilike.${search},company.ilike.${search}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error searching contacts:', error);
    throw error;
  }

  return data || [];
}

export default searchContacts;