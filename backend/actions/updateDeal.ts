import { supabase } from '../lib/supabase';

type UpdateDealParams = {
  dealId: string;
  name?: string;
  useCase?: string;
  stage?: string;
  signal?: 'positive' | 'neutral' | 'negative';
  description?: string;
  contactId?: string;
};

async function updateDeal(params: UpdateDealParams) {
  const { dealId, ...updates } = params;
  
  // Convert camelCase to snake_case for database
  const dbUpdates: any = {};
  
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.useCase !== undefined) dbUpdates.use_case = updates.useCase;
  if (updates.stage !== undefined) dbUpdates.stage = updates.stage;
  if (updates.signal !== undefined) dbUpdates.signal = updates.signal;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.contactId !== undefined) dbUpdates.contact_id = updates.contactId;
  
  // Always update the updated_at timestamp
  dbUpdates.updated_at = new Date().toISOString();

  console.log('updateDeal: Updating deal with params:', { dealId, dbUpdates });

  const { data, error } = await supabase
    .from('deals')
    .update(dbUpdates)
    .eq('id', dealId)
    .select('*')
    .single();

  if (error) {
    console.error('updateDeal: Error updating deal:', error);
    throw error;
  }

  console.log('updateDeal: Successfully updated deal:', data);
  return data;
}

export default updateDeal;