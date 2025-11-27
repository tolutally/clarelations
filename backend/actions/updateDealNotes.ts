import { supabase } from '../lib/supabase';
import type { DealNote } from '../types/deal';

export async function addDealNote(dealId: string, content: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current deal with notes
    const { data: deal, error: fetchError } = await supabase
      .from('deals')
      .select('notes')
      .eq('id', dealId)
      .single();

    if (fetchError) {
      console.error('Error fetching deal:', fetchError);
      return { success: false, error: fetchError.message };
    }

    // Create new note
    const newNote: DealNote = {
      id: crypto.randomUUID(),
      content: content.trim(),
      created_at: new Date().toISOString(),
      updated_at: null,
      deleted_at: null,
      author: null // Can be populated with user ID when auth is implemented
    };

    // Append to existing notes array
    const existingNotes = (deal.notes as DealNote[]) || [];
    const updatedNotes = [...existingNotes, newNote];

    // Update the deal
    const { error: updateError } = await supabase
      .from('deals')
      .update({ notes: updatedNotes })
      .eq('id', dealId);

    if (updateError) {
      console.error('Error updating deal notes:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding note:', error);
    return { success: false, error: 'Failed to add note' };
  }
}

export async function updateDealNote(
  dealId: string, 
  noteId: string, 
  content: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current deal with notes
    const { data: deal, error: fetchError } = await supabase
      .from('deals')
      .select('notes')
      .eq('id', dealId)
      .single();

    if (fetchError) {
      console.error('Error fetching deal:', fetchError);
      return { success: false, error: fetchError.message };
    }

    const existingNotes = (deal.notes as DealNote[]) || [];
    
    // Update the specific note
    const updatedNotes = existingNotes.map(note => {
      if (note.id === noteId) {
        return {
          ...note,
          content: content.trim(),
          updated_at: new Date().toISOString()
        };
      }
      return note;
    });

    // Update the deal
    const { error: updateError } = await supabase
      .from('deals')
      .update({ notes: updatedNotes })
      .eq('id', dealId);

    if (updateError) {
      console.error('Error updating deal note:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating note:', error);
    return { success: false, error: 'Failed to update note' };
  }
}

export async function deleteDealNote(
  dealId: string, 
  noteId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current deal with notes
    const { data: deal, error: fetchError } = await supabase
      .from('deals')
      .select('notes')
      .eq('id', dealId)
      .single();

    if (fetchError) {
      console.error('Error fetching deal:', fetchError);
      return { success: false, error: fetchError.message };
    }

    const existingNotes = (deal.notes as DealNote[]) || [];
    
    // Soft delete - mark the note as deleted
    const updatedNotes = existingNotes.map(note => {
      if (note.id === noteId) {
        return {
          ...note,
          deleted_at: new Date().toISOString()
        };
      }
      return note;
    });

    // Update the deal
    const { error: updateError } = await supabase
      .from('deals')
      .update({ notes: updatedNotes })
      .eq('id', dealId);

    if (updateError) {
      console.error('Error deleting deal note:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting note:', error);
    return { success: false, error: 'Failed to delete note' };
  }
}
