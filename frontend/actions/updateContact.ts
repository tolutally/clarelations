import { supabase } from '../lib/supabase';

async function updateContact({ 
  id,
  first_name, 
  last_name, 
  email, 
  phone, 
  company, 
  position,
  linkedin,
  acquisition_channel,
  status, 
  tags 
}: { 
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  position?: string | null;
  linkedin?: string | null;
  acquisition_channel?: string | null;
  status?: string;
  tags?: string[];
}) {
  const { data, error } = await supabase
    .from('contacts')
    .update({
      first_name,
      last_name,
      email,
      phone: phone || null,
      company: company || null,
      position: position || null,
      linkedin: linkedin || null,
      acquisition_channel: acquisition_channel || null,
      status: status || 'active',
      tags: tags || [],
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating contact:', error);
    throw error;
  }

  return data;
}

export default updateContact;