# ElevenLabs Voice Agent Integration

## Overview
The ABM service now includes an integrated ElevenLabs voice agent that can interact with prospects on custom landing pages. The agent has access to meeting transcripts and company information to provide personalized conversations.

## Features Added

### 1. Database Schema Updates
- Added `meeting_transcript` TEXT field to store meeting transcripts
- Added `agent_config` JSONB field for future agent configuration options
- Migration: `/supabase/migrations/005_add_meeting_transcript.sql`

### 2. Admin Interface Updates
- Added transcript field to page creation/edit forms
- Transcript textarea in admin UI for easy copy/paste
- Saved automatically with page data

### 3. Voice Agent Component
- Location: `/components/voice-agent.tsx`
- Features:
  - Start/end voice conversations
  - Visual connection status indicator
  - Client-side tools for agent to access:
    - `getMeetingTranscript()` - Returns the meeting transcript for context
    - `getCompanyInfo()` - Returns company name and page details
    - `logMessage()` - Logs agent messages for debugging

### 4. Custom Page Integration
- Voice agent widget appears on all custom ABM pages
- Positioned prominently above the main content
- Agent ID: `agent_6301k7rp217yfx1sn748jxts0pdn`

## How to Use

### For Admins
1. When creating/editing a page, paste the meeting transcript in the "Meeting Transcript" field
2. This transcript will be available to the AI agent for context
3. The agent can reference specific points from meetings to provide personalized responses

### For Prospects
1. Visit the custom ABM page (e.g., `/trig4xcompany`)
2. Click "Start Voice Call" to begin conversation with AI agent
3. The agent will have context from meeting transcripts to answer questions
4. Click "End Call" when finished

## Technical Details

### Client Tools Available to Agent
```javascript
clientTools: {
  getMeetingTranscript: async () => string
  getCompanyInfo: async () => object
  logMessage: async (message) => string
}
```

### Dynamic Variables Passed
- `companyName` - The prospect's company name

## Database Migration Required
Run the following migration in Supabase SQL Editor:
```sql
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS meeting_transcript TEXT,
ADD COLUMN IF NOT EXISTS agent_config JSONB DEFAULT '{}';
```

## Future Enhancements
- Multiple agent personalities based on page/company
- Rich content display during conversations (pricing, features, etc.)
- Call recording and transcript generation
- Analytics on agent interactions
- Custom agent training per organization