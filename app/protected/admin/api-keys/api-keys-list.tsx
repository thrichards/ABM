"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateApiKey, revokeApiKey } from "./actions";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  is_active: boolean;
}

interface ApiKeysListProps {
  organizationId: string;
  userId: string;
  existingKeys: ApiKey[];
  isAdmin: boolean;
}

export function ApiKeysList({ organizationId, userId, existingKeys, isAdmin }: ApiKeysListProps) {
  const router = useRouter();
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiry, setNewKeyExpiry] = useState("90"); // days
  const [isCreating, setIsCreating] = useState(false);
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleCreateKey = async () => {
    if (!newKeyName.trim() || !isAdmin) return;

    setIsCreating(true);
    try {
      const result = await generateApiKey({
        organizationId,
        userId,
        name: newKeyName,
        expiryDays: parseInt(newKeyExpiry),
      });

      if (result.success && result.apiKey) {
        setShowNewKey(result.apiKey);
        setNewKeyName("");
        router.refresh();
      } else {
        alert(result.error || "Failed to create API key");
      }
    } catch (error) {
      console.error("Error creating API key:", error);
      alert("Failed to create API key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      return;
    }

    try {
      const result = await revokeApiKey(keyId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to revoke API key");
      }
    } catch (error) {
      console.error("Error revoking API key:", error);
      alert("Failed to revoke API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    // Use a consistent format that doesn't depend on locale
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  return (
    <div className="space-y-6">
      {/* New Key Modal */}
      {showNewKey && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">API Key Created</h3>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ Save this key now. You won&apos;t be able to see it again!
              </p>
              <div className="bg-white dark:bg-gray-800 rounded border p-2 font-mono text-sm break-all">
                {showNewKey}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(showNewKey)}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                {copiedKey ? "Copied!" : "Copy Key"}
              </button>
              <button
                onClick={() => setShowNewKey(null)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Key */}
      {isAdmin && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Create New API Key</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Key name (e.g., Production API)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={newKeyExpiry}
              onChange={(e) => setNewKeyExpiry(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="30">Expires in 30 days</option>
              <option value="90">Expires in 90 days</option>
              <option value="365">Expires in 1 year</option>
              <option value="0">Never expires</option>
            </select>
            <button
              onClick={handleCreateKey}
              disabled={!newKeyName.trim() || isCreating}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Generate Key"}
            </button>
          </div>
        </div>
      )}

      {/* Existing Keys */}
      <div className="bg-card rounded-lg border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Active API Keys</h3>
        </div>
        {existingKeys && existingKeys.length > 0 ? (
          <div className="divide-y">
            {existingKeys.map((key) => (
              <div key={key.id} className="p-6 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium">{key.name}</span>
                    <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {key.key_prefix}...
                    </code>
                    {!key.is_active && (
                      <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded">
                        Revoked
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground space-x-4">
                    <span>Created: {formatDate(key.created_at)}</span>
                    <span>Last used: {formatDate(key.last_used_at)}</span>
                    <span>Expires: {formatDate(key.expires_at)}</span>
                  </div>
                </div>
                {isAdmin && key.is_active && (
                  <button
                    onClick={() => handleRevokeKey(key.id)}
                    className="px-4 py-2 text-sm border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-muted-foreground">
            No API keys created yet. Create your first key above.
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
        <h4 className="font-semibold mb-2">How to use API keys</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Include your API key in the Authorization header when making API requests:
        </p>
        <code className="block bg-white dark:bg-gray-900 p-3 rounded text-sm">
          Authorization: Bearer trig_xxxxxxxxxxxxx
        </code>
      </div>
    </div>
  );
}