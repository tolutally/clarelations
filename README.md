# ClaRelations CRM

A modern, AI-ready Customer Relationship Management (CRM) system built with React, TypeScript, and Supabase. ClaRelations helps sales teams manage contacts, track deals, and streamline their sales pipeline with Gmail integration and AI-powered analysis.

![ClaRelations CRM](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/react-18.3-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.5-blue)
![Supabase](https://img.shields.io/badge/supabase-enabled-green)

## 📁 Project Structure

```
clarelations/
├── backend/          # Node.js/Express API server
│   ├── api/         # API endpoints
│   ├── actions/     # Database actions
│   ├── services/    # Business logic services
│   ├── migrations/  # Database migrations
│   ├── types/       # TypeScript type definitions
│   └── supabase/    # Supabase configuration
└── frontend/        # React frontend application
    ├── src/         # Source code
    ├── components/  # React components
    ├── contexts/    # React contexts
    ├── lib/         # Utility libraries
    └── public/      # Static assets
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

### Installation
```bash
# Install all dependencies
npm run install:all

# Or install individually
npm install
cd backend && npm install
cd frontend && npm install
```

### Development Commands

```bash
# Run both frontend and backend
npm run dev

# Run backend only
npm run backend:dev

# Run frontend only
npm run frontend:dev

# Build frontend for production
npm run build
```

## 🚀 Features

### Contact Management

- **Comprehensive Contact Profiles** - Store and manage detailed contact information including name, email, phone, company, and position
- **Company & Position Tracking** - Link contacts to companies with role information
- **Contact-Deal Relationships** - Seamlessly connect contacts to deals and track associated opportunities
- **Quick Actions** - Add notes and log activities directly from contact details

### Deal Pipeline Management

- **Kanban Board View** - Visual pipeline with intuitive drag-and-drop deal management
- **Multiple Deal Stages**:
  - 🆕 New - Fresh opportunities
  - ✅ Qualified - Vetted leads
  - 💬 Negotiating - Active discussions
  - 🎉 Closed Won - Successful deals
  - ❌ Closed Lost - Archived opportunities
- **Deal Signals** - Track sentiment with positive, neutral, or negative indicators
- **Use Case Tracking** - Document specific customer needs and applications
- **Deal Details Page** - Comprehensive view with all deal information, notes, and attachments
- **Deal Metrics** - Track creation date, last update, and stage progression

### File Management

- **Document Attachments** - Upload and manage files for any deal
- **Supabase Storage Integration** - Secure, scalable file storage with CDN delivery
- **File Preview & Download** - Quick access to uploaded documents
- **Multiple File Types** - Support for documents (.docx, .pdf), images, HTML files, and more
- **Attachment Sidebar** - Clean, organized view of all deal files

### Notes & Activities

- **Rich Note System** - Add, edit, and delete notes with full timestamps
- **Activity Logging** - Track calls and other interactions
- **Audit Trail** - Maintain history of deleted notes for compliance
- **Inline Editing** - Quick note updates without page reload
- **Quick Add Interface** - Rapidly capture important information during calls

### Modern UI/UX

- **Responsive Design** - Works seamlessly on desktop and tablet
- **Dark Mode Ready** - Prepared for theme switching
- **Smooth Animations** - Polished transitions and interactions
- **Keyboard Shortcuts** - Efficient navigation for power users
- **Loading States** - Clear feedback during data operations

## 🛠️ Technology Stack

### Frontend

- **React 18.3** - Modern UI library with hooks and concurrent features
- **TypeScript 5.5** - Type-safe development with full IntelliSense
- **Vite 5** - Lightning-fast build tool and dev server with HMR
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible component library built on Radix UI
- **Lucide React** - Modern, consistent icon library
- **React DnD** - Drag and drop functionality for kanban board

### Backend & Database

- **Supabase** - Complete Backend-as-a-Service (BaaS)
  - PostgreSQL database with full SQL support
  - Row Level Security (RLS) for data protection
  - Storage API for file management
  - Real-time subscriptions (planned)
  - Built-in authentication (ready to implement)

### Development Tools

- **ESLint** - Code quality and consistency
- **PostCSS** - Advanced CSS processing
- **TypeScript** - Compile-time type checking
- **Git** - Version control

## 📋 Prerequisites

- **Node.js** 18+ and npm/yarn
- **Supabase Account** - Free tier available at [supabase.com](https://supabase.com)
- **Git** - For version control

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/clarelations.git
cd clarelations
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. **Create a Supabase project** at [supabase.com](https://supabase.com)
2. **Get your credentials** from Project Settings → API:
   - Project URL
   - Anon/Public Key
3. **Create environment file** - Copy `.env.local.example` to `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Database Migrations

Execute these SQL files in your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql) in order:

#### Step 1: Create Initial Schema

```sql
-- Run: supabase-schema.sql
-- Creates contacts, deals, and activities tables with indexes
```

#### Step 2: Update Deals Table

```sql
-- Run: update-deals-table.sql
-- Adds name, use_case, signal columns and removes old columns
```

#### Step 3: Add Notes System

```sql
-- Run: supabase/migrations/20251109120000_add_notes_to_deals.sql
-- Adds JSONB notes column for note management
```

#### Step 4: Set Up File Storage

```sql
-- Run: supabase/migrations/20251109090812_storage_setup.sql
-- Creates deal-attachments bucket and adds attachments column
```

### 5. Configure Storage Policies

Run this SQL to enable file uploads for unauthenticated users:

```sql
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow anon uploads to deal attachments" ON storage.objects;
DROP POLICY IF EXISTS "Public can read deal attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to deal attachments" ON storage.objects;

-- Allow anonymous uploads (for development)
CREATE POLICY "Allow anon uploads to deal attachments"
ON storage.objects 
FOR INSERT 
TO anon
WITH CHECK (bucket_id = 'deal-attachments');

-- Allow public read access
CREATE POLICY "Public can read deal attachments"
ON storage.objects 
FOR SELECT
TO public
USING (bucket_id = 'deal-attachments');

-- Allow authenticated users to upload (for production)
CREATE POLICY "Allow authenticated uploads to deal attachments"
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'deal-attachments');
```

### 6. Start the Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see the application running!

## 📁 Project Structure

```
clarelations/
├── src/
│   ├── main.tsx              # Application entry point
│   └── index.css             # Global styles
├── app/
│   └── app.tsx               # Main app component with routing
├── actions/                  # Server actions for data operations
│   ├── addAttachment.ts      # File upload handling
│   ├── createContact.ts      # Contact creation
│   ├── createDeal.ts         # Deal creation
│   ├── loadContacts.ts       # Contact data fetching
│   ├── loadDeals.ts          # Deal data fetching
│   ├── loadDealById.ts       # Single deal fetching
│   ├── updateDeal.ts         # Deal updates
│   ├── updateDealNotes.ts    # Note CRUD operations
│   ├── updateDealStage.ts    # Stage changes
│   └── removeAttachment.ts   # File deletion
├── components/
│   ├── ui/                   # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── sheet.tsx
│   │   └── textarea.tsx
│   ├── AttachmentList.tsx    # File attachment display
│   ├── ContactDetails.tsx    # Contact detail view
│   ├── ContactList.tsx       # Contact list view
│   ├── ContactForm.tsx       # Contact creation/edit form
│   ├── CreateContactSheet.tsx # Contact creation modal
│   ├── CreateDealSheet.tsx   # Deal creation modal
│   ├── DealCard.tsx          # Kanban board deal card
│   ├── DealColumn.tsx        # Kanban board column
│   ├── DealDetailsPage.tsx   # Full deal details page
│   ├── DealDetailSheet.tsx   # Deal quick view modal
│   ├── DealsBoard.tsx        # Main kanban board
│   └── DealsBoardContainer.tsx # Board container with state
├── lib/
│   ├── supabase.ts           # Supabase client configuration
│   ├── storage.ts            # File storage utilities
│   └── utils.ts              # Helper functions
├── types/                    # TypeScript type definitions
│   ├── contact.ts            # Contact types
│   ├── deal.ts               # Deal and attachment types
│   └── activity.ts           # Activity types
├── supabase/
│   ├── config.toml           # Supabase local config
│   └── migrations/           # Database migration scripts
├── .env.local                # Environment variables (create this)
├── package.json              # Project dependencies
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── vite.config.ts            # Vite build configuration
```

## 🔐 Security Features

### Row Level Security (RLS)

Current configuration (customize for production):

```sql
-- Contacts table - Public access (development)
CREATE POLICY "Allow all operations on contacts" 
ON contacts FOR ALL 
USING (true) 
WITH CHECK (true);

-- Deals table - Public access (development)
CREATE POLICY "Allow all operations on deals" 
ON deals FOR ALL 
USING (true) 
WITH CHECK (true);

-- Storage - Anonymous uploads allowed (development)
-- See storage policies above
```

### Production Security Recommendations

1. **Enable Authentication** - Implement Supabase Auth
2. **User-Based RLS** - Restrict access to user's own data
3. **Role-Based Access** - Admin vs. User permissions
4. **API Rate Limiting** - Protect against abuse
5. **Authenticated Uploads Only** - Remove anonymous upload policy

## 📊 Database Schema

### Contacts Table

```sql
CREATE TABLE contacts (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  company TEXT,
  position TEXT,
  linkedin TEXT,
  acquisition_channel TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  tags TEXT[],
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Deals Table

```sql
CREATE TABLE deals (
  id BIGSERIAL PRIMARY KEY,
  contact_id BIGINT REFERENCES contacts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  use_case TEXT,
  stage TEXT NOT NULL DEFAULT 'new',
  signal TEXT DEFAULT 'neutral',
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  attachments JSONB DEFAULT '[]'::jsonb,
  notes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Activities Table

```sql
CREATE TABLE activities (
  id BIGSERIAL PRIMARY KEY,
  contact_id BIGINT REFERENCES contacts(id) ON DELETE CASCADE,
  deal_id BIGINT REFERENCES deals(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Storage Buckets

- **deal-attachments** - Public bucket for file storage

## 🎨 UI Components

Built with **shadcn/ui** for consistent, accessible design:

- **Button** - Primary, secondary, outline variants
- **Card** - Container for content sections
- **Dialog** - Modal dialogs for confirmations
- **Sheet** - Slide-in panels for forms and details
- **Form** - Form inputs with validation
- **Select** - Dropdown selections
- **Textarea** - Multi-line text input
- **Badge** - Status indicators and labels

## 🔄 Data Flow

1. **User Action** → Component event handler
2. **Action Call** → Server action function in `/actions`
3. **Supabase Query** → Database or Storage API
4. **Response** → Data returned to component
5. **State Update** → UI re-renders with new data
6. **Callback** → Parent components notified (onDealUpdated, etc.)

## 📝 Key Features Deep Dive

### Notes System

- **Add Notes** - Quick capture with automatic timestamps
- **Edit Notes** - Inline editing with updated_at tracking
- **Delete Notes** - Soft delete with deleted_at timestamp for audit trail
- **Note History** - Full audit log of all note changes
- **Author Tracking** - Record who created each note (ready for auth)

### File Attachments

- **Upload Flow**:
  1. User selects file via input
  2. File validated (size, type)
  3. Uploaded to Supabase Storage
  4. Metadata saved to deals.attachments JSONB column
  5. Public URL returned for access
- **Supported Types**: Documents, images, HTML, archives
- **Max File Size**: 10MB (configurable)
- **Storage**: Files organized by deal ID in folders

### Drag & Drop Kanban

- **Drag Deal Cards** between stage columns
- **Real-time Updates** to database
- **Optimistic UI** for instant feedback
- **Sort Order** maintained within columns
- **Visual Feedback** during drag operations

## 🐛 Troubleshooting

### Files Not Uploading

**Error:** "new row violates row-level security policy"

**Solution:** Run the storage policies SQL (see step 5 above)

### Environment Variables Not Loading

**Issue:** App shows "Using mock data mode"

**Solution:**

1. Check `.env.local` exists in project root
2. Verify variable names start with `VITE_`
3. Restart dev server: `npm run dev`

### Database Connection Issues

**Issue:** "Failed to fetch" or connection errors

**Solution:**

1. Check Supabase project is active
2. Verify credentials in `.env.local`
3. Check RLS policies are created
4. Ensure tables exist (run migrations)

### Attachments Not Showing After Upload

**Issue:** Files upload but don't appear when viewing deal

**Solution:**

1. Check `loadDealById.ts` includes `d.attachments` in SELECT
2. Verify attachments column is JSONB (not TEXT[])
3. Run: `fix-attachments-column.sql`

## 🚧 Roadmap

### Phase 1 (Completed ✅)

- ✅ Contact management system
- ✅ Deal pipeline with Kanban board
- ✅ File attachments with Supabase Storage
- ✅ Notes system with CRUD operations
- ✅ Responsive UI with Tailwind CSS
- ✅ TypeScript type safety
- ✅ Drag and drop deal management

### Phase 2 (In Progress 🔄)

- [ ] User authentication with Supabase Auth
- [ ] User-specific data access with RLS
- [ ] Email integration for contact communication
- [ ] Calendar and task scheduling
- [ ] Advanced search and filtering
- [ ] Export functionality (CSV, PDF)

### Phase 3 (Planned 📋)

- [ ] AI-powered deal insights
- [ ] Automated email suggestions
- [ ] Risk prediction and scoring
- [ ] Advanced analytics dashboard
- [ ] Mobile responsive improvements
- [ ] Team collaboration features
- [ ] Notification system
- [ ] Audit logs and reporting

### Phase 4 (Future 🔮)

- [ ] Mobile native apps (iOS/Android)
- [ ] API for third-party integrations
- [ ] Webhook support
- [ ] Custom fields and workflows
- [ ] Advanced permissions system
- [ ] Multi-language support

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

### Development Workflow

1. **Fork** the repository
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with clear, focused commits
4. **Write/update tests** if applicable
5. **Update documentation** (README, code comments)
6. **Commit**: `git commit -m 'Add amazing feature'`
7. **Push**: `git push origin feature/amazing-feature`
8. **Open a Pull Request** with clear description

### Code Style

- Use TypeScript for all new code
- Follow existing component patterns
- Use Tailwind CSS for styling
- Add comments for complex logic
- Keep functions small and focused

### Commit Messages

Use conventional commits format:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Maintenance tasks

## 📜 Scripts

```bash
# Development
npm run dev          # Start dev server with HMR

# Building
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check
```

## 🧪 Testing (Coming Soon)

```bash
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run end-to-end tests
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful component library
- **[Supabase](https://supabase.com/)** - Backend infrastructure and database
- **[Lucide](https://lucide.dev/)** - Icon library
- **[Tailwind CSS](https://tailwindcss.com/)** - CSS framework
- **[Vite](https://vitejs.dev/)** - Build tool and dev server
- **[React](https://react.dev/)** - UI library

## 📞 Support

Need help? Here's how to get support:

- 📖 Check the [Documentation](docs/)
- 🐛 Report bugs via [GitHub Issues](https://github.com/yourusername/clarelations/issues)
- 💬 Join discussions in [GitHub Discussions](https://github.com/yourusername/clarelations/discussions)
- 📧 Email: <support@clarelations.com>

## 🔗 Useful Links

- [Live Demo](https://clarelations.vercel.app) (coming soon)
- [Documentation](https://docs.clarelations.com) (coming soon)
- [API Reference](https://api.clarelations.com) (coming soon)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Built with ❤️ for sales teams everywhere**

*ClaRelations - Manage relationships, close deals*
# Last updated: Fri Nov 14 19:17:16 AST 2025
