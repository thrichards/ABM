# AI Transcript Summary Feature - Setup Guide

This guide will help you set up the AI-powered transcript summarization feature for ABM pages.

## Overview

The AI summary feature allows you to condense long meeting transcripts when editing ABM pages. It addresses the issue where transcripts are too long to send to the ElevenLabs agent (> 65KB WebRTC limit).

**Location**: The AI summary button appears on the **page edit form** next to the "Meeting Transcript" field, NOT on the call logs page.

## Features

- **AI-Powered Condensing**: Uses Anthropic's Claude models to compress transcripts
- **Real-time Size Display**: Shows current transcript size with warning when > 65KB
- **Customizable Prompts**: Use saved templates or write custom prompts
- **Side Panel Interface**: Clean UI with prompt editing, input/output display
- **Compression Stats**: See how much the transcript was reduced
- **One-Click Replace**: Insert the condensed transcript directly into the form
- **Token Tracking**: Monitor AI usage and costs

## Setup Instructions

### 1. Apply Database Migration

You need to apply the migration file `012_ai_prompts_and_generations.sql` to your Supabase database.

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase/migrations/012_ai_prompts_and_generations.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click "Run" to execute the migration

**Option B: Using Supabase CLI**

```bash
# Initialize Supabase (if not already done)
npx supabase init

# Link to your remote project
npx supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
npx supabase db push
```

**Option C: Manual Migration via psql**

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" < supabase/migrations/012_ai_prompts_and_generations.sql
```

### 2. Get Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to **API Keys**
4. Create a new API key
5. Copy the API key (starts with `sk-ant-`)

### 3. Add Environment Variable

Add your Anthropic API key to your `.env` file:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-api-key-here
```

**Important**: The API key MUST be set as a server-side environment variable (not `NEXT_PUBLIC_`).

If deploying to Vercel:
1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add `ANTHROPIC_API_KEY` with your key
4. Redeploy your application

### 4. Restart Development Server

```bash
# Stop the current dev server (Ctrl+C)
# Restart it
npm run dev
```

### 5. Verify Installation

1. Navigate to edit an ABM page: `/protected/admin/pages/[page-id]/edit` or create a new page
2. Scroll to the "Meeting Transcript" field
3. You should see a "Generate Summary" button with a sparkly icon next to the label
4. The field shows the current byte count (warning if > 65KB)

## Usage

### Condensing a Transcript

1. Go to edit an ABM page (or create a new one)
2. Paste a long meeting transcript into the "Meeting Transcript" field
3. Click the **"Generate Summary"** button (sparkly icon)
4. Choose a prompt template (default: "Condense Transcript") or write a custom one
5. Click **"Generate Summary"**
6. Wait for the AI to process (usually 10-30 seconds)
7. Review the condensed version and compression stats
8. Click **"Use This Summary in Form"** to replace the transcript
9. Save the page

### Creating Custom Prompts

Default prompts are automatically created for each organization. To create custom prompts:

1. Insert directly into the database via Supabase SQL Editor:

```sql
INSERT INTO ai_prompts (
  organization_id,
  name,
  description,
  prompt_type,
  system_prompt,
  user_prompt_template,
  model,
  temperature,
  max_tokens,
  is_default,
  is_active
) VALUES (
  'your-organization-id',
  'Quick Summary',
  'Generates a brief 1-paragraph summary',
  'meeting_summary',
  'You are a concise meeting summarizer.',
  'Summarize this meeting in 1-2 sentences:\n\n{{transcript}}',
  'claude-3-5-sonnet-20241022',
  0.3,
  1000,
  false,
  true
);
```

### Prompt Template Variables

Use `{{transcript}}` as a placeholder in your prompt templates. This will be replaced with the actual transcript text.

Example:
```
Please analyze this meeting and identify:
- Main topics discussed
- Action items

Meeting transcript:
{{transcript}}
```

## Database Schema

### `ai_prompts` Table

Stores reusable prompt templates:

- `id`: UUID primary key
- `organization_id`: Links to organization
- `name`: Display name
- `description`: What the prompt does
- `prompt_type`: Type of operation (e.g., 'meeting_summary')
- `system_prompt`: System message for AI
- `user_prompt_template`: Template with `{{transcript}}` placeholder
- `model`: AI model to use (default: `claude-3-5-sonnet-20241022`)
- `temperature`: Creativity level (0.0 - 1.0)
- `max_tokens`: Maximum output length
- `is_default`: Whether this is the default for its type
- `is_active`: Whether the prompt is available

### `ai_generations` Table

Stores history of AI generations:

- `id`: UUID primary key
- `organization_id`: Links to organization
- `prompt_id`: Which prompt was used
- `call_log_id`: Links to the call log
- `generation_type`: Type of generation
- `input_text`: The transcript that was processed
- `output_text`: The AI-generated summary
- `status`: 'pending', 'processing', 'completed', or 'failed'
- `tokens_used`: Total tokens consumed
- `cost_usd`: Estimated cost in USD
- `created_at`: Timestamp

## Available Models

The system supports all Anthropic Claude models:

- `claude-3-5-sonnet-20241022` (default) - Best balance of speed and quality
- `claude-3-opus-20240229` - Highest quality, slower
- `claude-3-sonnet-20240229` - Fast and capable
- `claude-3-haiku-20240307` - Fastest, most economical

## Cost Estimates

Approximate costs per 1,000 tokens (as of October 2024):

**Claude 3.5 Sonnet** (default):
- Input: $0.003 per 1K tokens
- Output: $0.015 per 1K tokens

**Typical meeting summary**:
- Input: ~2,000-5,000 tokens (transcript)
- Output: ~500-1,500 tokens (summary)
- Cost per summary: ~$0.01 - $0.05

## Troubleshooting

### "Call log not found"
- Ensure the call has a transcript in the database
- Check that you have access to the organization

### "Unauthorized access"
- Verify you're logged in
- Check that your user is part of the organization

### "Failed to generate summary"
- Check that `ANTHROPIC_API_KEY` is set correctly
- Verify the API key is valid and has credits
- Check browser console for detailed error messages

### No prompts available
- Ensure the migration was applied successfully
- Check that default prompts were inserted (they're created automatically for each organization)

### API Key not working
- Ensure the key starts with `sk-ant-`
- Verify it's set as a server-side variable (not `NEXT_PUBLIC_`)
- Restart your development server after adding the key
- For production, redeploy after adding the environment variable

## File Structure

```
/app/protected/admin/pages/
  ├── page-form.tsx              # Page edit form (UPDATED - includes AI button)
  ├── transcript-actions.ts      # Server actions for transcript summarization (NEW)
  └── [id]/calls/
      ├── page.tsx              # Call logs page (unchanged)
      └── actions.ts            # Server actions for call log summaries (NEW - not used yet)

/components/
  ├── transcript-summary-panel.tsx  # Transcript summary side panel (NEW)
  └── ai-summary-panel.tsx         # Generic AI summary panel (NEW - for future use)

/supabase/migrations/
  └── 012_ai_prompts_and_generations.sql  # Database schema (NEW)
```

## Next Steps

You can extend this feature by:

1. Creating a dedicated prompt management UI in the admin panel
2. Adding prompt sharing between organizations
3. Implementing streaming for real-time generation
4. Adding more AI operations (e.g., action item extraction, sentiment analysis)
5. Creating automated summaries when calls complete

## Support

For issues or questions:
- Check the Vercel AI SDK docs: https://sdk.vercel.ai/docs
- Anthropic API docs: https://docs.anthropic.com/
- Supabase docs: https://supabase.com/docs
