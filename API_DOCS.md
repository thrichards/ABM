# ABM Pages API Documentation

## Setup Requirements

### Environment Variables
To use the API, you must set the following environment variable in your `.env` file:

```bash
# Required for API key validation
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

You can find your Service Role Key in your Supabase project:
1. Go to your Supabase Dashboard
2. Navigate to Settings > API
3. Copy the `service_role` secret key (keep this secure!)

## Authentication
All API endpoints require authentication via API key. You can generate API keys from the Admin UI at `/protected/admin/api-keys`.

Include your API key in the Authorization header:
```
Authorization: Bearer trig_xxxxxxxxxxxxx
```

## Endpoints

### 1. Create a Page
**POST** `/api/pages`

Create a new ABM page for a prospect.

#### Request Body
```json
{
  "slug": "trig-for-transpoco", // Required - URL slug
  "company_name": "Transpoco", // Required
  "title": "Welcome to Your Custom Experience", // Optional
  "hero_title": "Transpoco x Trig", // Optional
  "hero_subtitle": "How Transpoco and Trig could partner", // Optional
  "body_markdown": "## Your Journey\n\nMarkdown content here...", // Optional
  "meeting_transcript": "Transcript from sales call...", // Optional
  "is_published": true, // Optional, default: false
  "email_gate_enabled": true, // Optional, default: false
  "email_gate_type": "domain", // Optional: "any", "domain", "allowlist"
  "email_gate_domain": "transpoco.com", // Optional - for domain restriction
  "email_gate_allowlist": ["john@transpoco.com", "jane@transpoco.com"] // Optional - for allowlist
}
```

#### Response
```json
{
  "success": true,
  "page": {
    "id": "uuid",
    "slug": "trig-for-transpoco",
    "company_name": "Transpoco",
    // ... all page fields
  },
  "url": "https://yourdomain.com/trig-for-transpoco"
}
```

### 2. List Pages
**GET** `/api/pages`

Get all pages for your organization (determined by API key).

#### Response
```json
{
  "pages": [
    {
      "id": "uuid",
      "slug": "trig-for-transpoco",
      "company_name": "Transpoco",
      "is_published": true,
      "created_at": "2024-01-01T00:00:00Z",
      // ... all page fields
    }
  ]
}
```

### 3. Get a Single Page
**GET** `/api/pages/{pageId}`

Get details of a specific page.

#### Response
```json
{
  "page": {
    "id": "uuid",
    "slug": "trig-for-transpoco",
    "company_name": "Transpoco",
    // ... all page fields
  }
}
```

### 4. Update a Page
**PUT** `/api/pages/{pageId}`

Update an existing page. Only include fields you want to update.

#### Request Body
```json
{
  "hero_title": "Updated Title",
  "body_markdown": "## New content\n\nUpdated markdown...",
  "is_published": true
}
```

#### Response
```json
{
  "success": true,
  "page": {
    // ... updated page data
  },
  "url": "https://yourdomain.com/trig-for-transpoco"
}
```

### 5. Delete a Page
**DELETE** `/api/pages/{pageId}`

Delete a page permanently.

#### Response
```json
{
  "success": true
}
```

## Example Usage

### Using cURL
```bash
# Create a new page
curl -X POST https://yourdomain.com/api/pages \
  -H "Authorization: Bearer trig_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "trig-for-acme",
    "company_name": "Acme Corp",
    "hero_title": "Acme x Trig Partnership",
    "body_markdown": "## Welcome Acme!\n\nWe are excited to partner with you.",
    "is_published": true
  }'

# List pages
curl -X GET https://yourdomain.com/api/pages \
  -H "Authorization: Bearer trig_your_api_key_here"

# Update a page
curl -X PUT https://yourdomain.com/api/pages/page-id \
  -H "Authorization: Bearer trig_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "is_published": false
  }'
```

### Using JavaScript/TypeScript
```javascript
// Create a page
const API_KEY = 'trig_your_api_key_here';

const response = await fetch('/api/pages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    slug: 'trig-for-acme',
    company_name: 'Acme Corp',
    hero_title: 'Acme x Trig Partnership',
    body_markdown: '## Welcome Acme!\n\nCustom content here...',
    is_published: true
  })
});

const data = await response.json();
console.log('Created page:', data.page);
console.log('Page URL:', data.url);
```

## Error Responses

All endpoints return appropriate HTTP status codes:

- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: You don't have access to this resource
- **404 Not Found**: Resource doesn't exist
- **400 Bad Request**: Invalid request data or duplicate slug
- **500 Internal Server Error**: Server error

Error response format:
```json
{
  "error": "Error message describing what went wrong"
}
```

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.

## Webhooks

You can extend the API to trigger webhooks when pages are created, updated, or deleted by modifying the API routes.