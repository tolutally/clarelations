// Minimal ambient module declarations for packages used by the app but not present in
// npm during initial setup. Add real types or package installs later as needed.
declare module '@quibakery/data' {
  export * from '../lib/quibakery-data';
}

declare module '@uibakery/data' {
  export * from '../lib/quibakery-data';
}

declare module '@components/*';

// Provide lightweight re-exports so imports like `@types/contact` resolve to the
// actual local type files in `types/` used across the project.
declare module '@types/contact' {
  import type { Contact } from './contact';
  import type { Activity } from './activity';
  export type Contact = Contact;
  export type Activity = Activity;
}

declare module '@types/activity' {
  import type { Activity } from './activity';
  export type Activity = Activity;
}

declare module '@types/deal' {
  import type { Deal, DealWithContact } from './deal';
  export type Deal = Deal;
  export type DealWithContact = DealWithContact;
}