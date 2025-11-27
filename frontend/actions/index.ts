// Supabase action exports
// These use Supabase directly for data operations

// Contact actions
export { default as loadContacts } from './loadContacts';
export { default as loadContactById } from './loadContactById';
export { default as createContact } from './createContact';
export { default as updateContact } from './updateContact';
export { default as deleteContact } from './deleteContact';
export { default as searchContacts } from './searchContacts';
export { default as countContacts } from './countContacts';

// Deal actions
export { default as loadDeals } from './loadDeals';
export { default as loadDealById } from './loadDealById';
export { default as loadDealsByContact } from './loadDealsByContact';
export { default as createDeal } from './createDeal';
export { default as updateDeal } from './updateDeal';
export { default as updateDealStage } from './updateDealStage';
export { default as updateDealSortOrder } from './updateDealSortOrder';
export { default as deleteDeal } from './deleteDeal';
export { default as updateDealNotes } from './updateDealNotes';

// Activity actions
export { default as loadActivities } from './loadActivities';
export { default as loadDealActivities } from './loadDealActivities';
export { default as createActivity } from './createActivity';
export { default as updateActivity } from './updateActivity';
export { default as deleteActivity } from './deleteActivity';

// Attachment actions
export { default as addAttachment } from './addAttachment';
export { default as removeAttachment } from './removeAttachment';

// Company actions
export { default as loadCompanies } from './loadCompanies';