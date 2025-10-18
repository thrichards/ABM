"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { VoiceAgent } from "./voice-agent";
import { EmailGate } from "./email-gate";
import trigMarkLogo from "@/app/trigMark.svg";
import heroBg from "@/app/HeroBG.webp";
import footerBg from "@/app/FooterBG.webp";
import whiteLogo from "@/app/Trig Horizontal Mark-white.svg";

interface CustomPageDisplayProps {
  page: {
    id: string;
    slug: string;
    title?: string;
    company_name?: string;
    hero_title?: string;
    hero_subtitle?: string;
    meeting_transcript?: string;
    body_markdown?: string;
    content?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    email_gate_enabled?: boolean;
    email_gate_type?: string;
    email_gate_domain?: string;
    email_gate_allowlist?: string[];
  };
}

export function CustomPageDisplay({ page }: CustomPageDisplayProps) {
  const [hasAccess, setHasAccess] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has already provided email for this page
    if (!page.email_gate_enabled) {
      setHasAccess(true);
    } else {
      const storedEmail = sessionStorage.getItem(`page_access_${page.id}`);
      if (storedEmail) {
        setHasAccess(true);
        setUserEmail(storedEmail);
      }
    }
  }, [page.id, page.email_gate_enabled]);

  const handleEmailSuccess = (email: string) => {
    setHasAccess(true);
    setUserEmail(email);
  };

  // Show email gate if enabled and user hasn't provided email yet
  if (page.email_gate_enabled && !hasAccess) {
    return (
      <EmailGate
        pageId={page.id}
        emailGateType={page.email_gate_type || "any"}
        emailGateDomain={page.email_gate_domain}
        emailGateAllowlist={page.email_gate_allowlist}
        onSuccess={handleEmailSuccess}
      />
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Image with opacity */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${heroBg.src || heroBg})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Gradient overlay to fade out bottom */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, transparent 90%, transparent 80%, hsl(var(--background)) 100%)",
          }}
        />

        <div className="container mx-auto px-4 pt-20 pb-16 md:pt-28 md:pb-20 relative z-10">
          {/* Logo */}
          <div className="mb-8">
            <Image
              src={trigMarkLogo}
              alt="trigMark"
              width={150}
              height={50}
              className="h-12 w-auto"
            />
          </div>

          {/* Left-aligned hero content */}
          <div className="max-w-7xl">
            <div className="lg:w-2/3">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-left font-circular text-foreground">
                {page.hero_title || `Welcome, ${page.company_name}`}
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-left">
                {page.hero_subtitle ||
                  "We've crafted this experience specifically for your organization"}
              </p>
            </div>
          </div>
        </div>

        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Content Section with Sidebar */}
      <section className="container mx-auto px-4 pt-8 pb-16">
        <div className="max-w-7xl">
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Main Content - Left Column */}
            <div className="order-2 lg:order-1 lg:col-span-2">
              {page.body_markdown ? (
                <div
                  className="prose max-w-none dark:prose-invert
                              prose-headings:font-circular
                              prose-h1:text-3xl prose-h1:font-semibold
                              prose-h2:text-2xl prose-h2:font-semibold
                              prose-h3:text-xl prose-h3:font-semibold
                              prose-h4:text-lg prose-h4:font-semibold
                              prose-p:text-lg prose-p:text-muted-foreground
                              prose-li:text-lg prose-li:text-muted-foreground
                              prose-strong:font-semibold prose-strong:text-foreground
                              prose-a:text-primary prose-a:no-underline prose-a:font-medium hover:prose-a:underline"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {page.body_markdown}
                  </ReactMarkdown>
                </div>
              ) : (
                // Default content if no markdown is provided
                <div className="space-y-12">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4 font-circular">
                      Your Journey with Us
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      We&apos;re excited to partner with {page.company_name} and
                      help you achieve your goals. This is just the beginning of
                      what we can accomplish together.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="border-l-4 border-primary pl-6">
                      <h3 className="text-xl font-semibold mb-3 font-circular">
                        Tailored Solutions
                      </h3>
                      <p className="text-lg text-muted-foreground">
                        Our platform adapts to your specific industry
                        requirements and business processes.
                      </p>
                    </div>
                    <div className="border-l-4 border-primary pl-6">
                      <h3 className="text-xl font-semibold mb-3 font-circular">
                        Dedicated Support
                      </h3>
                      <p className="text-lg text-muted-foreground">
                        Your success is our priority, with personalized
                        onboarding and ongoing assistance.
                      </p>
                    </div>
                  </div>

                  {/* Call to Action */}
                  <div className="mt-12">
                    <button className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-lg font-medium">
                      Schedule Your Demo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar - Voice Agent & Meeting Booking */}
            <div className="order-1 lg:order-2 lg:col-span-1">
              <div className="lg:sticky lg:top-8 space-y-6">
                {/* AI Agent Card */}
                <div className="bg-card/50 backdrop-blur-sm rounded-lg border p-6">
                  <VoiceAgent pageData={page} userEmail={userEmail} />
                </div>

                {/* Meeting Booking Card */}
                <div className="bg-card/50 backdrop-blur-sm rounded-lg border p-6 text-center">
                  <h3 className="text-lg font-semibold mb-3 font-circular">
                    Ready to learn more?
                  </h3>
                  <p className="text-base text-muted-foreground mb-4">
                    Schedule a personalized demo with our team
                  </p>
                  <a
                    href="https://www.trig.ai/demo" // TODO: Replace with actual booking URL
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    Book a Meeting
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative mt-16 overflow-hidden">
        {/* Background Image - no opacity */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${footerBg.src || footerBg})`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Footer content */}
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <Image
                  src={whiteLogo}
                  alt="trigMark"
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                />
                <p className="text-base text-white">
                  © {new Date().getFullYear()} - Personalized experience for{" "}
                  {page.company_name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
