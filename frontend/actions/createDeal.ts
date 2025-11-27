import { supabase, useMockData } from '../lib/supabase';
import { mockDeals } from './loadDeals';
import type { Attachment } from '../types/deal';

let mockDealIdCounter = 4;

async function createDeal({
  contact_id,
  name,
  use_case,
  stage,
  signal,
  description,
  attachments
}: {
  contact_id: string | null;
  name: string;
  use_case: string;
  stage: string;
  signal: string;
  description: string;
  attachments?: Attachment[] | null;
}) {
  console.log('createDeal called with:', { contact_id, name, use_case, stage, signal, attachments });
  console.log('useMockData:', useMockData);
  console.log('supabase client:', supabase ? 'Connected' : 'Not connected');
  
  if (useMockData) {
    console.log('Creating mock deal');
    const newDeal: any = {
      id: String(mockDealIdCounter++),
      contact_id,
      name,
      use_case,
      stage,
      signal,
      description,
      attachments,
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Add contact details if contact_id is provided
      contact_first_name: '',
      contact_last_name: '',
      contact_email: '',
      contact_company: '',
    };
    
    // Add the new deal to the mockDeals array so it appears in loadDeals
    mockDeals.push(newDeal);
    console.log('Added deal to mockDeals array. Total deals:', mockDeals.length);
    
    return [newDeal];
  }

  console.log('Using Supabase - creating deal in database...');

  // If contact_id is provided, fetch contact details to store in deals table
  let contactDetails = null;
  if (contact_id) {
    console.log('Fetching contact details for contact_id:', contact_id);
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .select('first_name, last_name, email, company')
      .eq('id', contact_id)
      .single();
    
    if (contactError) {
      console.error('Error fetching contact:', contactError);
    } else {
      contactDetails = contactData;
      console.log('Fetched contact details:', contactDetails);
    }
  }

  // Get the max sort_order for the stage
  const { data: maxSortData } = await supabase
    .from('deals')
    .select('sort_order')
    .eq('stage', stage)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextSortOrder = maxSortData && maxSortData.length > 0 
    ? (maxSortData[0].sort_order || 0) + 1 
    : 1;

  console.log('Inserting deal into Supabase with sort_order:', nextSortOrder);

  const { data, error } = await supabase
    .from('deals')
    .insert({
      contact_id,
      name,
      use_case,
      stage,
      signal,
      description,
      attachments,
      sort_order: nextSortOrder,
      // Store contact details for easy export
      contact_first_name: contactDetails?.first_name || null,
      contact_last_name: contactDetails?.last_name || null,
      contact_email: contactDetails?.email || null,
      contact_company: contactDetails?.company || null,
    })
    .select();

  if (error) {
    console.error('Error creating deal:', error);
    throw error;
  }

  console.log('✅ Successfully created deal in Supabase:', data);
  return data;
}

export default createDeal;