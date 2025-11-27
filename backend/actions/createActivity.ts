import { supabase, useMockData } from '../lib/supabase';

let mockActivityIdCounter = 100;
let mockActivities: any[] = [];

async function createActivity({
  contact_id,
  deal_id,
  type,
  title,
  description,
  transcript,
  transcript_summary,
  created_at,
}: {
  contact_id: string | null;
  deal_id: string | null;
  type: string;
  title: string;
  description?: string;
  transcript?: string;
  transcript_summary?: string;
  created_by?: string; // Accept but ignore for compatibility
  created_at?: string;
}) {
  console.log('createActivity called with:', { contact_id, deal_id, type, title, description, transcript, transcript_summary, created_at });
  console.log('useMockData:', useMockData);
  
  if (useMockData) {
    console.log('Creating mock activity');
    const newActivity = {
      id: String(mockActivityIdCounter++),
      contact_id,
      deal_id,
      type,
      title,
      description: description || null,
      created_at: created_at || new Date().toISOString(),
    };
    
    mockActivities.push(newActivity);
    console.log('Mock activity created:', newActivity);
    return [newActivity];
  }

  console.log('Using Supabase - creating activity in database...');

  const activityData: any = {
    type,
    title,
    description: description || null,
    transcript: transcript || null,
    transcript_summary: transcript_summary || null,
  };

  // Add contact_id or deal_id
  if (contact_id) {
    activityData.contact_id = contact_id;
  }
  if (deal_id) {
    activityData.deal_id = deal_id;
  }

  // Add created_at if provided
  if (created_at) {
    activityData.created_at = created_at;
  }

  console.log('Inserting activity into Supabase:', activityData);

  const { data, error } = await supabase
    .from('activities')
    .insert(activityData)
    .select();

  if (error) {
    console.error('Error creating activity:', error);
    throw error;
  }

  console.log('✅ Successfully created activity in Supabase:', data);
  
  // Trigger deal signal analysis if this activity is associated with a deal
  if (deal_id && !useMockData) {
    console.log(`🎯 Triggering signal analysis for deal: ${deal_id}`);
    // Dynamic API URL based on environment (Render vs Vercel vs local)
    const apiUrl = import.meta.env.VITE_API_URL 
      ? `${import.meta.env.VITE_API_URL}/api/analyze-deal-signal`
      : '/api/analyze-deal-signal';
    
    // Fire and forget - don't wait for signal analysis to complete
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealId: deal_id }),
    })
      .then(res => res.json())
      .then(result => console.log(`✅ Deal signal updated: ${result.signal} - ${result.rationale}`))
      .catch(err => console.error('⚠️ Failed to update deal signal:', err));
  }
  
  return data;
}

export default createActivity;