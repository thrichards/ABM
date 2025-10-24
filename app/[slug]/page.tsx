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
    .select("title, company_name, hero_title, hero_subtitle")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!page) {
    return {
      title: "Page Not Found",
      description: "The page you're looking for could not be found.",
    };
  }

  const title =
    page.title ||
    page.hero_title ||
    `${page.company_name} + Trig`;
  const description =
    page.hero_subtitle ||
    `Information for ${page.company_name}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
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
