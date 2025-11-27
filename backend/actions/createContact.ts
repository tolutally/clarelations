import { supabase, useMockData } from '../lib/supabase';

// In-memory storage for mock mode
let mockContactsStore: any[] = [];
let nextMockId = 4;

async function createContact({
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
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  linkedin?: string;
  acquisition_channel?: string;
  status: 'active' | 'inactive';
  tags?: string[];
}) {
  // Use mock data if Supabase is not configured
  if (useMockData) {
    const newContact = {
      id: String(nextMockId++),
      first_name,
      last_name,
      email,
      phone: phone || null,
      company: company || null,
      position: position || null,
      linkedin: linkedin || null,
      acquisition_channel: acquisition_channel || null,
      status,
      tags: tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockContactsStore.push(newContact);
    console.log('✅ Created mock contact:', newContact);
    return newContact;
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert([{
      first_name,
      last_name,
      email,
      phone: phone || null,
      company: company || null,
      position: position || null,
      linkedin: linkedin || null,
      acquisition_channel: acquisition_channel || null,
      status,
      tags: tags || [],
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating contact:', error);
    throw error;
  }

  return data;
}

export default createContact;

// Export mock store so loadContacts can access it
export { mockContactsStore };