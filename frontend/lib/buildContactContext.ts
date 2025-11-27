import { supabase } from './supabase';

export interface ContactContext {
  contact: any;
  deals: any[];
  activities: any[];
}

export async function buildContactContext(contactId: string): Promise<string> {
  console.log('🔍 Building context for contact:', contactId);
  const startTime = Date.now();
  
  try {
    // Fetch all data in PARALLEL for maximum speed
    console.log('⚡ Fetching all data in parallel...');
    const [
      { data: contact, error: contactError },
      { data: deals, error: dealsError },
      { data: activities, error: activitiesError }
    ] = await Promise.all([
      supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single(),
      supabase
        .from('deals')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false }),
      supabase
        .from('activities')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    if (contactError) {
      console.error('❌ Contact fetch error:', contactError);
      throw contactError;
    }
    if (!contact) {
      console.error('❌ Contact not found for ID:', contactId);
      throw new Error('Contact not found');
    }

    if (dealsError) {
      console.error('❌ Deals fetch error:', dealsError);
      throw dealsError;
    }

    if (activitiesError) {
      console.error('❌ Activities fetch error:', activitiesError);
      throw activitiesError;
    }

    const dbTime = Date.now() - startTime;
    console.log(`✅ Data fetched in ${dbTime}ms: ${contact.name}, ${deals?.length || 0} deals, ${activities?.length || 0} activities`);

    // Build context string
    const contextParts = [
      `Contact: ${contact.name}`,
      `Email: ${contact.email || 'Not provided'}`,
      `Phone: ${contact.phone || 'Not provided'}`,
      `Company: ${contact.company || 'Not provided'}`,
      ``,
      `Deals (${deals?.length || 0}):`,
      ...(deals || []).map((deal: any) => 
        `- ${deal.title}: $${deal.value} (${deal.stage})`
      ),
      ``,
      `Recent Activities (${activities?.length || 0}):`,
      ...(activities || []).slice(0, 10).map((activity: any) => 
        `- [${activity.type}] ${new Date(activity.created_at).toLocaleDateString()}: ${activity.description || 'No description'}`
      )
    ];

    const context = contextParts.join('\n');
    const totalTime = Date.now() - startTime;
    console.log(`✅ Context built in ${totalTime}ms (${context.length} chars)`);
    return context;
  } catch (error) {
    console.error('❌ Error building contact context:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw new Error(`Failed to build contact context: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
