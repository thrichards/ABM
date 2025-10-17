"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOrganization } from "./actions";

interface OnboardingFormProps {
  userId: string;
}

export function OnboardingForm({ userId }: OnboardingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await createOrganization(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      // Add a small delay to ensure the database transaction is complete
      setTimeout(() => {
        router.refresh();
        router.push("/protected/admin");
      }, 500);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <input type="hidden" name="userId" value={userId} />

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2">
          Organization Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Acme Corp"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium mb-2">
          Organization Slug
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          pattern="[a-z0-9-]+"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="acme-corp"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Lowercase letters, numbers, and hyphens only
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Organization"}
      </button>
    </form>
  );
}