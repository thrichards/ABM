import { createPublicClient } from "@/lib/supabase/public";
import { notFound } from "next/navigation";
import { CustomPageDisplay } from "@/components/custom-page-display";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createPublicClient();

  const { data: page } = await supabase
    .from("pages")
    .select("title, company_name")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!page) {
    return {
      title: "Page Not Found",
    };
  }

  return {
    title: page.title || `${page.company_name} - Personalized Experience`,
    description: `A personalized experience crafted specifically for ${page.company_name}`,
  };
}

export default async function CustomPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createPublicClient();

  const { data: page, error } = await supabase
    .from("pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !page) {
    notFound();
  }

  return <CustomPageDisplay page={page} />;
}