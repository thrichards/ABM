"use client";

interface ExportButtonProps {
  emails: string[];
}

export function ExportButton({ emails }: ExportButtonProps) {
  const handleExport = () => {
    // Copy emails to clipboard as comma-separated list
    const emailList = emails.join(", ");
    navigator.clipboard.writeText(emailList);

    // Show a simple alert (in production you might want a toast notification)
    alert(`Copied ${emails.length} email${emails.length === 1 ? '' : 's'} to clipboard`);
  };

  const handleExportNewline = () => {
    // Copy emails to clipboard as newline-separated list
    const emailList = emails.join("\n");
    navigator.clipboard.writeText(emailList);

    // Show a simple alert
    alert(`Copied ${emails.length} email${emails.length === 1 ? '' : 's'} to clipboard (one per line)`);
  };

  if (emails.length === 0) return null;

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExport}
        className="px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-md"
        title="Copy emails as comma-separated list"
      >
        Copy Emails (Comma)
      </button>
      <button
        onClick={handleExportNewline}
        className="px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-md"
        title="Copy emails with one per line"
      >
        Copy Emails (Lines)
      </button>
    </div>
  );
}