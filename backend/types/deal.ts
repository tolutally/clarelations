export type Attachment = {
  name: string;
  url: string;
  size: number;
  type: string;
};

export type DealNote = {
  id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
  author?: string | null;
};

export type Deal = {
  id: string;
  contact_id: string | null;
  name: string;
  use_case: string;
  stage: 'new' | 'qualified' | 'negotiating' | 'closed_won' | 'closed_lost';
  signal: 'positive' | 'neutral' | 'negative';
  signal_rationale?: string | null; // AI-generated reasoning for the signal
  description: string;
  attachments?: DealAttachment[] | null;
  notes?: DealNote[] | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type DealAttachment = {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploaded_at: string;
};

/**
 * Deal record joined with its associated contact fields. Used by the DealsBoard to display
 * information about the deal and the contact in a single row. Additional contact fields may
 * be present depending on the action that loaded the data.
 */
export type DealWithContact = Deal & {
  contact_first_name: string;
  contact_last_name: string;
  contact_company?: string | null;
  contact_position?: string | null;
};