import { supabase } from './supabase';

export interface DealContext {
  deal: any;
  contact: any;
  activities: any[];
}

export async function buildDealContext(dealId: string): Promise<string> {
  try {
    console.log('🔍 Building context for deal:', dealId);
    
    // Fetch deal with contact info
    const { data: dealData, error: dealError } = await supabase
      .from('deals')
      .select(`
        *,
        contacts (
          id,
          first_name,
          last_name,
          email,
          phone,
          company,
          position
        )
      `)
      .eq('id', dealId)
      .single();

    if (dealError) {
      console.error('❌ Deal fetch error:', dealError);
      throw dealError;
    }
    if (!dealData) {
      console.error('❌ Deal not found:', dealId);
      throw new Error('Deal not found');
    }

    console.log('✅ Deal found:', dealData.name);

    const deal = Array.isArray(dealData) ? dealData[0] : dealData;
    const contact = deal.contacts;

    // Fetch deal activities
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (activitiesError) {
      console.error('❌ Activities fetch error:', activitiesError);
      throw activitiesError;
    }

    console.log(`✅ Found ${activities?.length || 0} activities`);

    // Calculate deal age and stage duration
    const dealAge = Math.floor(
      (Date.now() - new Date(deal.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const stageAge = Math.floor(
      (Date.now() - new Date(deal.updated_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Get last activity date
    const lastActivity = activities && activities.length > 0 
      ? activities[0].created_at 
      : null;
    const daysSinceLastActivity = lastActivity
      ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Build context string
    const contextParts = [
      `=== DEAL INFORMATION ===`,
      `Deal Name: ${deal.name}`,
      `Stage: ${deal.stage}`,
      `Signal: ${deal.signal}`,
      `Use Case: ${deal.use_case || 'Not specified'}`,
      `Description: ${deal.description || 'No description'}`,
      `Deal Age: ${dealAge} days`,
      `Days in Current Stage: ${stageAge} days`,
      daysSinceLastActivity !== null ? `Days Since Last Activity: ${daysSinceLastActivity} days` : '',
      `Created: ${new Date(deal.created_at).toLocaleDateString()}`,
      `Last Updated: ${new Date(deal.updated_at).toLocaleDateString()}`,
      ``,
      `=== CONTACT INFORMATION ===`,
      `Name: ${contact?.first_name || ''} ${contact?.last_name || ''}`,
      `Company: ${contact?.company || 'Not provided'}`,
      `Position: ${contact?.position || 'Not provided'}`,
      `Email: ${contact?.email || 'Not provided'}`,
      `Phone: ${contact?.phone || 'Not provided'}`,
      ``,
      `=== DEAL ACTIVITIES (${activities?.length || 0}) ===`,
    ];

    if (activities && activities.length > 0) {
      activities.forEach((activity: any) => {
        contextParts.push(
          `\n[${activity.type.toUpperCase()}] ${new Date(activity.created_at).toLocaleDateString()}`
        );
        contextParts.push(`Title: ${activity.title || 'No title'}`);
        if (activity.description) {
          contextParts.push(`Description: ${activity.description}`);
        }
        if (activity.transcript) {
          contextParts.push(`Transcript: ${activity.transcript.substring(0, 500)}...`);
        }
        if (activity.transcript_summary) {
          contextParts.push(`Summary: ${activity.transcript_summary}`);
        }
      });
    } else {
      contextParts.push('No activities recorded yet.');
    }

    // Add notes if they exist
    if (deal.notes && Array.isArray(deal.notes) && deal.notes.length > 0) {
      contextParts.push('', `=== DEAL NOTES (${deal.notes.length}) ===`);
      deal.notes.forEach((note: any) => {
        if (!note.deleted_at) {
          contextParts.push(`\n[${new Date(note.created_at).toLocaleDateString()}]`);
          contextParts.push(note.content);
        }
      });
    }

    const context = contextParts.filter(p => p !== '').join('\n');
    console.log(`✅ Context built successfully (${context.length} characters)`);
    
    return context;
  } catch (error) {
    console.error('❌ Error building deal context:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    throw new Error(`Failed to build deal context: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
