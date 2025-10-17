-- Add body_markdown field to pages table for custom markdown content
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS body_markdown TEXT;

-- Add comment for documentation
COMMENT ON COLUMN pages.body_markdown IS 'Markdown content for the main body of the page';