"use client";

import { useState, useRef, useEffect } from "react";
import { Conversation } from "@elevenlabs/client";
import Image from "next/image";
import outputGif from "@/app/output.gif";

interface VoiceAgentProps {
  pageData: {
    id?: string;
    company_name?: string;
    meeting_transcript?: string;
    hero_title?: string;
    hero_subtitle?: string;
  };
  agentId?: string; // Allow override of agent ID
  userEmail?: string | null; // User's email address
}

export function VoiceAgent({
  pageData,
  agentId = "agent_6301k7rp217yfx1sn748jxts0pdn",
  userEmail,
}: VoiceAgentProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const conversationRef = useRef<Awaited<
    ReturnType<typeof Conversation.startSession>
  > | null>(null);
  const isStartingRef = useRef(false);

  const startConversation = async () => {
    if (isConnecting || isConnected || isStartingRef.current) return;

    isStartingRef.current = true;
    setIsConnecting(true);

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone permission granted");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sessionConfig: any = {
        agentId: agentId,
        connectionType: "webrtc",
        metadata: {
          pageId: pageData.id,
          companyName: pageData.company_name || "",
          userEmail: userEmail || "",
        },
        dynamicVariables: {
          companyName: pageData.company_name || "",
          userEmail: userEmail || "",
        },
        clientTools: {
          getMeetingTranscript: async (): Promise<string> => {
            console.log("Agent requested meeting transcript");
            if (pageData.meeting_transcript) {
              return pageData.meeting_transcript;
            }
            return "No meeting transcript available for this session.";
          },
          getCompanyInfo: async (): Promise<string> => {
            console.log("Agent requested company info");
            return JSON.stringify({
              name: pageData.company_name || "",
              pageTitle: pageData.hero_title || "Welcome",
              subtitle: pageData.hero_subtitle || "",
            });
          },
          logMessage: async ({
            message,
          }: {
            message: string;
          }): Promise<string> => {
            console.log("Agent log:", message);
            setMessages((prev) => [...prev, message]);
            return "Message logged";
          },
        },
        onConnect: () => {
          console.log("Connected to conversation");
          setIsConnected(true);
          setIsConnecting(false);
          isStartingRef.current = false;
        },
        onDisconnect: () => {
          console.log("Disconnected from conversation");
          setIsConnected(false);
          setIsConnecting(false);
          isStartingRef.current = false;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
          console.error("Conversation error:", error);
          setIsConnecting(false);
          isStartingRef.current = false;
        },
      };

      console.log("Starting conversation with agent:", agentId);
      const conversation = await Conversation.startSession(sessionConfig);
      conversationRef.current = conversation;
      console.log("Conversation started successfully");
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setIsConnecting(false);
      isStartingRef.current = false;
    }
  };

  const endConversation = async () => {
    if (conversationRef.current) {
      try {
        await conversationRef.current.endSession();
        conversationRef.current = null;
        setIsConnected(false);
        console.log("Conversation ended");
      } catch (error) {
        console.error("Error ending conversation:", error);
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.endSession().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center text-center">
      {/* Circular AI Assistant Avatar with proper overlay */}
      <div className="relative w-32 h-32 mb-4">
        <button
          onClick={!isConnected ? startConversation : endConversation}
          className="relative w-full h-full rounded-full overflow-hidden group cursor-pointer transition-transform hover:scale-105"
          disabled={isConnecting}
        >
          <Image
            src={outputGif}
            alt="AI Assistant"
            fill
            className="object-cover"
          />
        </button>

        {/* Green call icon overlay - positioned outside the button to avoid clipping */}
        <div
          className={`absolute -bottom-1 -right-1 w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
            isConnected
              ? "bg-red-500 hover:bg-red-600"
              : isConnecting
                ? "bg-yellow-500 animate-pulse"
                : "bg-green-500 hover:bg-green-600"
          } shadow-lg border-2 border-white`}
          onClick={!isConnected ? startConversation : endConversation}
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isConnected ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Assistant Info */}
      <div className="w-full">
        <h3 className="text-lg font-semibold mb-3 font-circular">
          AI Meeting Recap
        </h3>
        <p className="text-base text-muted-foreground mb-4">
          {isConnected
            ? "Connected! Ask about meeting details and next steps."
            : isConnecting
              ? "Connecting..."
              : "Click the avatar above to discuss insights from your recent call."}
        </p>

        {/* Connection Status */}
        <div className="flex items-center justify-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected
                ? "bg-green-500"
                : isConnecting
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-gray-300"
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {isConnected
              ? "Connected"
              : isConnecting
                ? "Connecting..."
                : "Not connected"}
          </span>
        </div>

        {/* Debug Messages */}
        {messages.length > 0 && (
          <div className="mt-4 p-3 bg-secondary/30 rounded-lg">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Agent Messages:
            </p>
            <div className="space-y-1">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className="text-xs text-foreground p-2 bg-background rounded border-l-2 border-primary"
                >
                  {msg}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
