# ElevenLabs Webhooks Setup Guide

## Overview
This application now supports receiving post-call webhooks from ElevenLabs to automatically log voice agent conversations. When a call ends, ElevenLabs sends detailed information including transcripts, analysis, duration, and cost to your webhook endpoint.

## Database Setup

### 1. Run the Migration
Apply the database migration to create the `call_logs` table:

```bash
# In your Supabase dashboard, go to SQL Editor and run:
/supabase/migrations/011_add_call_logs.sql
```

Or if using Supabase CLI locally:
```bash
supabase db push
```

### 2. Database Schema
The `call_logs` table stores:
- Page ID (links to the ABM page)
- Conversation ID and Agent ID
- Call metadata (duration, cost, timestamps)
- Full transcript and analysis
- User information (email, company name)
- Complete webhook payload for reference

## Environment Variables

Add the following to your `.env.local`:

```bash
# Required: Supabase service role key for webhook endpoint
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Optional: Webhook secret for signature verification
ELEVENLABS_WEBHOOK_SECRET=your_webhook_secret_here
```

**Important:** The `SUPABASE_SERVICE_ROLE_KEY` is required because the webhook endpoint needs to bypass Row Level Security (RLS) to insert call logs.

## ElevenLabs Configuration

### 1. Get Your Webhook URL
Your webhook endpoint is available at:
```
https://your-domain.com/api/webhooks/elevenlabs
```

For local development with ngrok:
```bash
ngrok http 3000
# Use: https://your-ngrok-url.ngrok.io/api/webhooks/elevenlabs
```

### 2. Configure in ElevenLabs Dashboard

1. Go to your ElevenLabs workspace settings
2. Navigate to **Webhooks** section
3. Click **Create Webhook**
4. Configure:
   - **URL:** Your webhook endpoint URL
   - **Event Type:** Select `post_call_transcription`
   - **Secret:** Generate a secret (save this to your `.env.local`)

### 3. Test the Webhook
1. Make a test call through your voice agent
2. Check the webhook delivery status in ElevenLabs dashboard
3. View the call log in your admin panel at `/protected/admin/pages/[page-id]/calls`

## How It Works

### Data Flow
1. User interacts with voice agent on ABM page
2. When call ends, ElevenLabs analyzes the conversation
3. ElevenLabs sends POST request to your webhook endpoint
4. Webhook verifies HMAC signature (if secret is configured)
5. Call log is stored in `call_logs` table
6. Admins can view logs in the admin panel

### Page Association
The webhook associates calls with pages using:
1. **Primary method:** `pageId` passed in conversation metadata
2. **Fallback method:** Match by `company_name`

The `pageId` is automatically included when the voice agent starts a conversation.

### Security
- **HMAC Verification:** Validates requests are from ElevenLabs using SHA-256 signature
- **Timestamp Validation:** Rejects requests older than 30 minutes
- **RLS Policies:** Only admins in the page's organization can view call logs

## Viewing Call Logs

### Admin Interface
Navigate to: `/protected/admin/pages/[page-id]/calls`

Call logs display:
- Call duration and cost
- Start and end timestamps
- User email and company name
- Full conversation transcript
- AI analysis (if available)
- Conversation ID for reference

### From Pages List
Click the **"Calls"** button next to any page to view its call logs.

## Webhook Payload Structure

The webhook receives data in this format:

```json
{
  "type": "post_call_transcription",
  "data": {
    "conversation_id": "conv_abc123",
    "agent_id": "agent_xyz789",
    "call_duration_seconds": 180,
    "call_cost_usd": 0.0523,
    "started_at": "2025-01-15T10:30:00Z",
    "ended_at": "2025-01-15T10:33:00Z",
    "transcript": [
      {
        "role": "agent",
        "message": "Hello! How can I help you today?"
      },
      {
        "role": "user",
        "message": "I'd like to know more about your pricing."
      }
    ],
    "analysis": {
      "summary": "User inquired about pricing...",
      "sentiment": "positive"
    },
    "metadata": {
      "pageId": "uuid-of-page",
      "userEmail": "prospect@company.com",
      "companyName": "Acme Corp"
    }
  },
  "event_timestamp": 1705318980
}
```

## Troubleshooting

### Webhooks Not Being Received
1. Check webhook URL is publicly accessible
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
3. Check ElevenLabs dashboard for webhook delivery failures
4. Review server logs for errors

### Signature Verification Failing
1. Ensure `ELEVENLABS_WEBHOOK_SECRET` matches the secret in ElevenLabs dashboard
2. Check system time is synchronized (for timestamp validation)
3. Verify webhook secret doesn't have extra whitespace

### Call Logs Not Appearing
1. Verify page ID is being passed correctly in metadata
2. Check RLS policies allow your user to view call logs
3. Ensure user is part of the page's organization

### Webhook Auto-Disabled
ElevenLabs disables webhooks after 10+ consecutive failures. To re-enable:
1. Fix the underlying issue
2. Go to ElevenLabs dashboard
3. Re-enable the webhook

## API Endpoint Details

**Endpoint:** `POST /api/webhooks/elevenlabs`

**Headers:**
- `Content-Type: application/json`
- `ElevenLabs-Signature: t=timestamp,v0=hash` (if using HMAC)

**Response Codes:**
- `200`: Webhook processed successfully
- `401`: Invalid signature
- `500`: Server error

**Note:** The endpoint always returns 200 for unmatched pages to prevent webhook auto-disable.

## Future Enhancements

Potential improvements:
- Real-time notifications when new calls are received
- Call analytics dashboard with metrics
- Export call logs to CSV
- Audio recording storage and playback
- Sentiment analysis visualization
- Integration with CRM systems
