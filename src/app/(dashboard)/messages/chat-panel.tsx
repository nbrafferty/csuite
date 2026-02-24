"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Message = {
  id: string;
  body: string;
  senderType: string;
  createdAt: Date;
  author: {
    id: string;
    name: string;
    role: string;
    avatarUrl: string | null;
  };
};

interface ChatPanelProps {
  messages: Message[];
  threadSubject: string;
  onSend: (body: string, senderType: "client" | "staff" | "internal") => void;
  isSending: boolean;
  isStaff: boolean;
}

export function ChatPanel({
  messages,
  threadSubject,
  onSend,
  isSending,
  isStaff,
}: ChatPanelProps) {
  const [body, setBody] = useState("");
  const [mode, setMode] = useState<"reply" | "internal">("reply");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    const senderType =
      mode === "internal"
        ? "internal"
        : isStaff
          ? "staff"
          : "client";
    onSend(body.trim(), senderType as "client" | "staff" | "internal");
    setBody("");
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="border-b border-surface-border px-6 py-4">
        <h2 className="text-lg font-semibold text-white">{threadSubject}</h2>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
        {messages.map((msg) => {
          const isInternal = msg.senderType === "internal";
          const isStaffMsg = msg.senderType === "staff" || isInternal;

          return (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col",
                isStaffMsg ? "items-end" : "items-start"
              )}
            >
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400">
                  {msg.author.name}
                </span>
                <span className="text-xs text-gray-600">
                  {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div
                className={cn(
                  "max-w-[75%] rounded-xl px-4 py-2.5 text-sm",
                  isInternal
                    ? "border border-yellow-600/30 bg-yellow-500/10 text-yellow-200"
                    : isStaffMsg
                      ? "bg-coral/20 text-white"
                      : "bg-surface-card text-gray-200"
                )}
              >
                {isInternal && (
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-yellow-500">
                    Internal Note
                  </span>
                )}
                <p className="whitespace-pre-wrap">{msg.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compose */}
      <div className="border-t border-surface-border p-4">
        {isStaff && (
          <div className="mb-2 flex gap-1">
            <button
              onClick={() => setMode("reply")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                mode === "reply"
                  ? "bg-coral text-white"
                  : "bg-surface-card text-gray-400 hover:text-white"
              )}
            >
              Reply
            </button>
            <button
              onClick={() => setMode("internal")}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                mode === "internal"
                  ? "bg-yellow-600 text-white"
                  : "bg-surface-card text-gray-400 hover:text-white"
              )}
            >
              Internal Note
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={mode === "internal" ? "Write an internal note..." : "Type a message..."}
            className={cn(
              "flex-1 rounded-lg border bg-surface-bg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none",
              mode === "internal"
                ? "border-yellow-600/40 focus:border-yellow-500"
                : "border-surface-border focus:border-coral"
            )}
          />
          <button
            type="submit"
            disabled={!body.trim() || isSending}
            className="flex items-center gap-2 rounded-lg bg-coral px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-coral-dark disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
