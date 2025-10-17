# Email Gate Feature Documentation

## Overview
The email gate feature allows you to require visitors to provide their email address before accessing custom ABM pages. This is perfect for lead generation and tracking engagement with your personalized content.

## Features

### 1. Flexible Email Restrictions
- **Any Email**: Accept any valid email address
- **Domain Restriction**: Only allow emails from a specific domain (e.g., @company.com)
- **Allowlist**: Only allow specific email addresses you've pre-approved

### 2. Lead Capture
- Captures email, first name, last name, and company
- Tracks IP address and user agent
- Records timestamp of capture
- Prevents duplicate captures per page

### 3. Session Persistence
- Once a user provides their email, they can access the page for the duration of their session
- No need to re-enter email on page refresh

## Database Migration Required

Run this migration in your Supabase SQL Editor:

```sql
-- Add email gate settings to pages table
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS email_gate_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_gate_type VARCHAR(20) CHECK (email_gate_type IN ('domain', 'allowlist', 'any')),
ADD COLUMN IF NOT EXISTS email_gate_domain VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_gate_allowlist TEXT[];

-- Create table to store captured emails
CREATE TABLE IF NOT EXISTS page_email_captures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  company VARCHAR(255),
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  UNIQUE(page_id, email)
);

-- Create indexes
CREATE INDEX idx_page_email_captures_page ON page_email_captures(page_id);
CREATE INDEX idx_page_email_captures_email ON page_email_captures(email);
CREATE INDEX idx_page_email_captures_captured_at ON page_email_captures(captured_at);

-- Enable RLS for page_email_captures
ALTER TABLE page_email_captures ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert their email (for the email gate)
CREATE POLICY "Anyone can submit email for gated pages" ON page_email_captures
  FOR INSERT WITH CHECK (true);

-- Policy: Organization members can view captured emails for their pages
CREATE POLICY "Organization members can view captured emails" ON page_email_captures
  FOR SELECT USING (
    page_id IN (
      SELECT id FROM pages
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  );
```

## How to Use

### For Admins

#### 1. Enable Email Gate on a Page
- When creating or editing a page, check "Require email to view page"
- Choose restriction type:
  - **Any email**: Anyone can access with a valid email
  - **Specific domain**: Enter the required domain (e.g., "company.com")
  - **Specific emails**: Enter allowed email addresses, one per line

#### 2. View Captured Leads
- Go to your admin dashboard
- Click "Leads" next to any page
- See all captured emails with:
  - Email address
  - Name (if provided)
  - Company (if provided)
  - Capture timestamp
  - IP address

#### 3. Export Leads
You can query the `page_email_captures` table directly in Supabase to export leads as CSV.

### For Visitors

#### 1. Accessing a Gated Page
- Visit the custom page URL
- Fill out the email form
- Submit to access the content
- The page will remember you for the session

#### 2. Domain Restrictions
- If domain restriction is enabled, only emails from that domain will be accepted
- Error messages will guide users to use the correct email

#### 3. Allowlist
- Only pre-approved email addresses can access
- Contact the page owner if your email isn't on the list

## Technical Implementation

### Components
- **EmailGate Component** (`/components/email-gate.tsx`): The email capture form
- **API Route** (`/app/api/capture-email/route.ts`): Handles email submission
- **Custom Page Display**: Checks email gate status and shows content accordingly

### Data Storage
- Email gate settings stored in `pages` table
- Captured emails stored in `page_email_captures` table
- Session storage used for client-side access persistence

### Security
- RLS policies ensure only organization members can view captured emails
- Email validation on both client and server
- Session-based access (not permanent)

## Best Practices

1. **Clear Value Proposition**: Make sure visitors understand why they should provide their email
2. **Privacy Policy**: Include a privacy notice on the email form
3. **Follow-up**: Have a plan to nurture captured leads
4. **Testing**: Test all restriction types before publishing
5. **Regular Export**: Export leads regularly for your CRM/marketing automation

## Future Enhancements
- Email verification (send confirmation email)
- Integration with CRM systems (Salesforce, HubSpot)
- Advanced analytics on email captures
- Custom fields for additional data capture
- Email templates for follow-up
- Webhook notifications for new captures