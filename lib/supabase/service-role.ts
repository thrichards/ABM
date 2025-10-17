import { createServerClient } from "@supabase/ssr";

/**
 * Creates a Supabase client with Service Role privileges.
 * This client bypasses Row Level Security and should only be used
 * in secure server-side contexts like API routes.
 *
 * IMPORTANT: Never expose the service role key to the client!
 */
export function createServiceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Please add it to your .env file. " +
      "You can find it in your Supabase project settings under Settings > API."
    );
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  );
}