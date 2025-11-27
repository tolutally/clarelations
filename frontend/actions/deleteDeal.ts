import { supabase, useMockData } from '../lib/supabase';
import { mockDeals } from './loadDeals';

export type DeleteDealParams = {
  dealId: string;
};

// Mock storage for when Supabase is not configured
let mockDealsDeleted: string[] = [];

/**
 * Delete a deal
 * @param params - The deal ID to delete
 */
export async function deleteDeal({ dealId }: DeleteDealParams): Promise<void> {
  console.log('Deleting deal:', { dealId, useMockData });

  if (useMockData) {
    console.log('Using mock data for deal deletion');
    mockDealsDeleted.push(dealId);
    
    // Remove from mockDeals array
    const index = mockDeals.findIndex(d => d.id === dealId);
    if (index !== -1) {
      mockDeals.splice(index, 1);
      console.log('Deal removed from mockDeals. Remaining deals:', mockDeals.length);
    }
    
    return;
  }

  // Real Supabase mode - delete from database
  const { error } = await supabase
    .from('deals')
    .delete()
    .eq('id', dealId);

  if (error) {
    console.error('Error deleting deal:', error);
    throw error;
  }

  console.log('Deal deleted successfully');
}

export default deleteDeal;
