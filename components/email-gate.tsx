"use client";

import { useState } from "react";

interface EmailGateProps {
  pageId: string;
  emailGateType: string;
  emailGateDomain?: string;
  emailGateAllowlist?: string[];
  onSuccess: () => void;
}

export function EmailGate({
  pageId,
  emailGateType,
  emailGateDomain,
  emailGateAllowlist,
  onSuccess,
}: EmailGateProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }

    // Check domain restriction (without revealing the required domain)
    if (emailGateType === "domain" && emailGateDomain) {
      const emailDomain = email.split("@")[1];
      if (emailDomain.toLowerCase() !== emailGateDomain.toLowerCase()) {
        setError("Access restricted");
        return false;
      }
    }

    // Check allowlist (without revealing it's an allowlist)
    if (emailGateType === "allowlist" && emailGateAllowlist) {
      if (!emailGateAllowlist.some(allowed => allowed.toLowerCase() === email.toLowerCase())) {
        setError("Access restricted");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/capture-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pageId,
          email,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit");
      }

      // Store email in session/cookie
      sessionStorage.setItem(`page_access_${pageId}`, email);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20">
      <div className="w-full max-w-md mx-auto p-8">
        <div className="bg-card rounded-lg shadow-xl border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome
            </h1>
            <p className="text-muted-foreground">
              Please enter your email to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                placeholder="Email address"
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}