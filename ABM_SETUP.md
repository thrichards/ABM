# ABM Service Setup Guide

## Overview
This is a basic Account-Based Marketing (ABM) service that allows admins to create custom landing pages for prospect customers. The system is multi-tenant using Supabase authentication.

## Features
- ✅ Multi-tenant architecture with organizations
- ✅ Admin authentication and protected routes
- ✅ Create custom pages with unique slugs (e.g., /trig4xcompany)
- ✅ Blank root page
- ✅ Admin UI for managing pages
- ✅ Dynamic routing for custom slugs
- ✅ Beautiful, responsive custom page display

## Database Setup

1. **Run the migration** in your Supabase dashboard:
   - Go to SQL Editor in your Supabase dashboard
   - Copy the contents of `/supabase/migrations/001_initial_schema.sql`
   - Run the SQL to create the required tables and RLS policies

## How It Works

### Authentication Flow
1. Users sign up at `/auth/sign-up`
2. After authentication, new users are redirected to `/protected/onboarding`
3. Users create their organization during onboarding
4. Once onboarded, users can access the admin panel at `/protected/admin`

### Creating Custom Pages
1. Navigate to `/protected/admin`
2. Click "Create New Page"
3. Fill in the required fields:
   - **Page Slug**: The URL path (e.g., "trig4xcompany" creates `/trig4xcompany`)
   - **Company Name**: The prospect company's name
   - **Page Title**: Optional SEO title
   - **Hero Title**: Main heading on the page
   - **Hero Subtitle**: Subheading text
4. Choose whether to publish immediately
5. Save the page

### Viewing Custom Pages
- Published pages are accessible at `/{slug}` (e.g., `/trig4xcompany`)
- Pages display a personalized experience with:
  - Custom hero section with company name
  - Tailored content blocks
  - Professional design with gradient backgrounds
  - Call-to-action buttons

## Admin Routes
- `/protected/admin` - Main dashboard listing all pages
- `/protected/admin/pages/new` - Create a new page
- `/protected/admin/pages/[id]/edit` - Edit an existing page
- `/protected/onboarding` - Initial organization setup

## Database Schema

### Tables Created:
1. **organizations** - Multi-tenant organizations
2. **organization_users** - User-organization relationships
3. **pages** - Custom ABM landing pages

### Row Level Security:
- Users can only see/edit pages in their organization
- Published pages are publicly viewable
- Admin role required for certain operations

## Next Steps

### Immediate Enhancements:
1. **Rich Content Editor**: Add a WYSIWYG editor for page content
2. **Meeting Transcript Integration**: Parse and display meeting insights
3. **Analytics**: Track page views and engagement
4. **Templates**: Pre-built page templates for different industries

### Future Features:
1. **AI Content Generation**: Auto-generate personalized content
2. **CRM Integration**: Sync with Salesforce/HubSpot
3. **Multi-user Collaboration**: Team members with different roles
4. **A/B Testing**: Test different page variations
5. **Custom Domains**: Allow custom domains for pages

## Testing the System

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Sign up for a new account at `/auth/sign-up`

3. Complete onboarding by creating an organization

4. Create your first custom page in the admin panel

5. View the published page at its slug URL

## Notes
- The root page (`/`) is intentionally blank as requested
- All custom pages are served from root-level slugs
- The system supports multiple organizations (multi-tenancy)
- Pages can be saved as drafts or published immediately