// Gmail Deal Extractor Types

export interface EmailThread {
  id: string;
  subject: string;
  messages: EmailMessage[];
  participantEmails: string[];
  lastMessageDate: Date;
}

export interface EmailMessage {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  date: Date;
  inReplyTo?: string;
  references?: string[];
}

export interface DealExtractionResult {
  confidence: number; // 0-10 scale
  shouldCreate: boolean; // true if confidence > 8
  requiresReview: boolean; // true if 6-8
  dealData?: {
    name: string;
    company: string;
    value?: number;
    stage: 'new' | 'qualified' | 'negotiating';
    description: string;
    useCase?: string;
  };
  contactData: {
    email: string;
    firstName: string;
    lastName: string;
    company: string;
    position?: string;
  };
  summary: string; // Summarized conversation for notes
  signals: {
    hasPricingDiscussion: boolean;
    hasMeetingRequest: boolean;
    hasContractMention: boolean;
    hasDecisionMaker: boolean;
    responseRate: number;
  };
  rejectionReason?: string;
}

export interface ContactExtractionResult {
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  position?: string;
  hasReplied: boolean;
  firstReplyDate?: Date;
  isValid: boolean; // Must have replied to be valid
}

export interface SyncStatus {
  lastSyncTime: Date;
  emailsProcessed: number;
  dealsCreated: number;
  dealsUpdated: number;
  contactsCreated: number;
  contactsUpdated: number;
  pendingReviews: number;
  errors: string[];
}
