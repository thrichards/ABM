"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePage } from "./pages/actions";

interface Page {
  id: string;
  slug: string;
  title?: string;
  company_name?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  email_gate_enabled?: boolean;
}

interface PagesListProps {
  pages: Page[];
}

// Helper function to format date consistently
function formatDate(dateString: string) {
  const date = new Date(dateString);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

export function PagesList({ pages }: PagesListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);

  const filteredPages = pages.filter(
    (page) =>
      page.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.company_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDelete = async (pageId: string, pageTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${pageTitle}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    setDeletingPageId(pageId);
    try {
      const result = await deletePage(pageId);
      if (result.error) {
        alert(`Failed to delete page: ${result.error}`);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting page:", error);
      alert("Failed to delete page");
    } finally {
      setDeletingPageId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="Search pages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border rounded-md flex-1 max-w-md"
        />
      </div>

      {filteredPages.length === 0 ? (
        <div className="text-center py-12 bg-secondary/10 rounded-lg">
          <p className="text-muted-foreground">
            {searchTerm
              ? "No pages found matching your search"
              : "No pages created yet"}
          </p>
          {!searchTerm && (
            <Link
              href="/protected/admin/pages/new"
              className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md"
            >
              Create Your First Page
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPages.map((page) => (
            <div
              key={page.id}
              className="border rounded-lg p-4 hover:bg-secondary/10 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">
                    {page.title || page.company_name || "Untitled Page"}
                  </h3>
                  <p className="text-sm text-muted-foreground">/{page.slug}</p>
                  <div className="flex gap-2 mt-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        page.is_published
                          ? "bg-green-500/10 text-green-600"
                          : "bg-yellow-500/10 text-yellow-600"
                      }`}
                    >
                      {page.is_published ? "Published" : "Draft"}
                    </span>
                    {page.email_gate_enabled && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-600">
                        Email Gate
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Updated {formatDate(page.updated_at)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/protected/admin/pages/${page.id}/edit`}
                    className="px-3 py-1 text-sm border rounded hover:bg-secondary"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/protected/admin/pages/${page.id}/leads`}
                    className="px-3 py-1 text-sm border rounded hover:bg-secondary"
                  >
                    Leads
                  </Link>
                  <Link
                    href={`/protected/admin/pages/${page.id}/calls`}
                    className="px-3 py-1 text-sm border rounded hover:bg-secondary"
                  >
                    Calls
                  </Link>
                  {page.is_published && (
                    <a
                      href={`/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-sm border rounded hover:bg-secondary"
                    >
                      View
                    </a>
                  )}
                  <button
                    onClick={() =>
                      handleDelete(
                        page.id,
                        page.title || page.company_name || "this page",
                      )
                    }
                    disabled={deletingPageId === page.id}
                    className="px-3 py-1 text-sm border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingPageId === page.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
