import { supabase, useMockData } from '../lib/supabase';

async function loadCompanies() {
  // Use mock data if Supabase is not configured
  if (useMockData) {
    return ['Acme Corp', 'TechStart', 'Innovate Inc'];
  }

  const { data, error } = await supabase
    .from('contacts')
    .select('company')
    .not('company', 'is', null)
    .order('company');

  if (error) {
    console.error('Error loading companies:', error);
    throw error;
  }

  // Extract unique companies
  const companies = [...new Set(data?.map(row => row.company).filter(Boolean))] as string[];
  return companies.sort();
}

export default loadCompanies;