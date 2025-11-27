import { supabase, useMockData } from '../lib/supabase';

async function deleteActivity({ id }: { id: string }) {
  console.log('deleteActivity called with:', { id });
  
  if (useMockData) {
    console.log('Deleting mock activity - not implemented');
    return;
  }

  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting activity:', error);
    throw error;
  }

  console.log('✅ Successfully deleted activity');
}

export default deleteActivity;