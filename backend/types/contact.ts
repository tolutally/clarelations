export type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  position: string | null;
  status: 'active' | 'inactive';
  tags: string[] | null;
  address?: string | null;
  linkedin?: string | null;
  acquisition_channel?: string | null;
  created_at: string;
  updated_at: string;
};