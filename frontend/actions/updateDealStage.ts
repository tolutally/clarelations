import { supabase } from '../lib/supabase';

async function updateDealStage({
  dealId,
  stage,
  sortOrder,
}: {
  dealId: string;
  stage: string;
  sortOrder?: number;
}) {
  console.log('updateDealStage called:', { dealId, stage, sortOrder });

  const updateData: any = {
    stage,
    updated_at: new Date().toISOString(),
  };

  if (sortOrder !== undefined) {
    updateData.sort_order = sortOrder;
  }

  const { data, error } = await supabase
    .from('deals')
    .update(updateData)
    .eq('id', dealId)
    .select();

  if (error) {
    console.error('Error updating deal stage:', error);
    throw error;
  }

  console.log('✅ Successfully updated deal stage:', data);
  return data;
}

export default updateDealStage;