// API client for frontend-backend communication
import { supabase } from './supabase';

/**
 * API Configuration
 * Determines the base URL for API calls based on environment
 */

// For Render deployment: use VITE_API_URL env var
// For Vercel deployment: use relative /api paths
// For local development: use localhost:3001
export const API_BASE_URL = 
  import.meta.env.VITE_API_URL || // Render backend URL
  (import.meta.env.PROD ? '/api' : 'http://localhost:3001'); // Vercel or local

export const getApiUrl = (endpoint: string) => {
  // If using Vercel serverless (no VITE_API_URL set in prod), use relative paths
  if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
    return endpoint; // Already starts with /api
  }
  
  // Otherwise use full URL
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function to get auth headers
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
  };
}

// Helper function to make API calls
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(getApiUrl(endpoint), {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
}

// Contact API calls
export const contactApi = {
  loadContacts: () => apiCall('/api/contacts'),
  loadContactById: (id: string) => apiCall(`/api/contacts/${id}`),
  createContact: (contact: any) => apiCall('/api/contacts', {
    method: 'POST',
    body: JSON.stringify(contact)
  }),
  updateContact: (id: string, contact: any) => apiCall(`/api/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(contact)
  }),
  deleteContact: (id: string) => apiCall(`/api/contacts/${id}`, {
    method: 'DELETE'
  }),
  searchContacts: (query: string) => apiCall(`/api/contacts/search?q=${encodeURIComponent(query)}`)
};

// Deal API calls
export const dealApi = {
  loadDeals: () => apiCall('/api/deals'),
  loadDealById: (id: string) => apiCall(`/api/deals/${id}`),
  loadDealsByContact: (contactId: string) => apiCall(`/api/deals?contactId=${contactId}`),
  createDeal: (deal: any) => apiCall('/api/deals', {
    method: 'POST',
    body: JSON.stringify(deal)
  }),
  updateDeal: (id: string, deal: any) => apiCall(`/api/deals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(deal)
  }),
  updateDealStage: (id: string, stage: string) => apiCall(`/api/deals/${id}/stage`, {
    method: 'PUT',
    body: JSON.stringify({ stage })
  }),
  updateDealSortOrder: (deals: any[]) => apiCall('/api/deals/sort-order', {
    method: 'PUT',
    body: JSON.stringify({ deals })
  }),
  deleteDeal: (id: string) => apiCall(`/api/deals/${id}`, {
    method: 'DELETE'
  }),
  // Deal notes
  updateDealNotes: (id: string, notes: string) => apiCall(`/api/deals/${id}/notes`, {
    method: 'PUT',
    body: JSON.stringify({ notes })
  }),
  addDealNote: (dealId: string, note: any) => apiCall(`/api/deals/${dealId}/notes`, {
    method: 'POST',
    body: JSON.stringify(note)
  }),
  updateDealNote: (dealId: string, noteId: string, note: any) => apiCall(`/api/deals/${dealId}/notes/${noteId}`, {
    method: 'PUT',
    body: JSON.stringify(note)
  }),
  deleteDealNote: (dealId: string, noteId: string) => apiCall(`/api/deals/${dealId}/notes/${noteId}`, {
    method: 'DELETE'
  })
};

// Activity API calls
export const activityApi = {
  loadActivities: () => apiCall('/api/activities'),
  loadDealActivities: (dealId: string) => apiCall(`/api/deals/${dealId}/activities`),
  createActivity: (activity: any) => apiCall('/api/activities', {
    method: 'POST',
    body: JSON.stringify(activity)
  }),
  updateActivity: (id: string, activity: any) => apiCall(`/api/activities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(activity)
  }),
  deleteActivity: (id: string) => apiCall(`/api/activities/${id}`, {
    method: 'DELETE'
  })
};

// Attachment API calls
export const attachmentApi = {
  addAttachment: async (dealId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dealId', dealId);
    
    const { data: { session } } = await supabase.auth.getSession();
    const headers: HeadersInit = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    
    return fetch(getApiUrl(`/api/deals/${dealId}/attachments`), {
      method: 'POST',
      headers,
      body: formData
    });
  },
  removeAttachment: (dealId: string, attachmentId: string) => apiCall(`/api/deals/${dealId}/attachments/${attachmentId}`, {
    method: 'DELETE'
  })
};

// Company API calls
export const companyApi = {
  loadCompanies: () => apiCall('/api/companies')
};

// Gmail API calls
export const gmailApi = {
  analyzeDeal: (content: any) => apiCall('/api/analyze-deal', {
    method: 'POST',
    body: JSON.stringify(content)
  }),
  syncGmail: (settings: any) => apiCall('/api/gmail/sync', {
    method: 'POST',
    body: JSON.stringify(settings)
  })
};
