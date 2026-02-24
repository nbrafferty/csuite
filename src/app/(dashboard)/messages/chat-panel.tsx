"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Icon } from "@/components/icons";
import { Avatar, StatusBadge } from "@/components/ui";
import { formatTime } from "@/lib/time";

const COLORS = {
  card: "#22222A",
  cardBorder: "#333338",
  coral: "#E85D5D",
  yellow: "#FFD60A",
  textPrimary: "#FFFFFF",
  textSecondary: "#999999",
  textMuted: "#666666",
  internalNote: "#2A2420",
  internalNoteBorder: "#5C4A2E",
};

interface MessageItem {
  id: string;
  sender: string;
  senderId: string;
  senderType: string;
  avatar: string;
  time: string;
  text: string;
  attachments: string[];
}

interface ThreadDetail {
  id: string;
  subject: string;
  orderId: string;
  orderTitle: string;
  status: string;
  assignee: { id: string; name: string } | null;
  client: {
    companyName: string;
    primaryContact: string;
    primaryContactRole: string;
    activeOrderCount: number;
    billingStatus: string;
  };
}

interface ChatPanelProps {
  thread: ThreadDetail | null;
  messages: MessageItem[];
  showContext: boolean;
  onToggleContext: () => void;
  onSendMessage: (text: string, type: "reply" | "internal") => void;
  sendError: string | null;
  isSending: boolean;
}

export function ChatPanel({
  thread,
  messages,
  showContext,
  onToggleContext,
  onSendMessage,
  sendError,
  isSending,
}: ChatPanelProps) {
  const [messageMode, setMessageMode] = useState<"reply" | "internal">(
    "reply"
  );
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!messageText.trim() || isSending) return;
    onSendMessage(messageText.trim(), messageMode);
    setMessageText("");
  }, [messageText, messageMode, isSending, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  if (!thread) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: COLORS.textMuted,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <Icon name="messages" color={COLORS.textMuted} size={48} />
          <div style={{ marginTop: 16, fontSize: 14 }}>
            Select a conversation
          </div>
        </div>
      </div>
    );
  }

  const clientInitials = thread.client.companyName
    .split(" ")
    .map((w) => w[0])
    .join("");

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      {/* Chat Header */}
      <div
        style={{
          padding: "14px 24px",
          borderBottom: `1px solid ${COLORS.cardBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            minWidth: 0,
          }}
        >
          <Avatar
            initials={clientInitials}
            size={40}
            bg="linear-gradient(135deg, #5B8DEF, #A78BFA)"
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              {thread.subject}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 2,
              }}
            >
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
                {thread.client.companyName}
              </span>
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>
                ·
              </span>
              <StatusBadge status={thread.status} />
            </div>
          </div>
        </div>
        <button
          onClick={onToggleContext}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: 6,
            border: `1px solid ${COLORS.cardBorder}`,
            background: showContext ? "rgba(232,93,93,0.08)" : "transparent",
            color: showContext ? COLORS.coral : COLORS.textSecondary,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <Icon
            name="info"
            color={showContext ? COLORS.coral : COLORS.textSecondary}
            size={14}
          />
          Details
        </button>
      </div>

      {/* Messages Area */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 16px" }}>
        {messages.map((msg) => {
          const isInternal = msg.senderType === "internal";
          const isStaff = msg.senderType === "staff" || isInternal;

          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 20,
                flexDirection: isStaff ? "row-reverse" : "row",
              }}
            >
              <Avatar
                initials={msg.avatar}
                size={32}
                bg={
                  isStaff
                    ? "linear-gradient(135deg, #E85D5D, #A78BFA)"
                    : "linear-gradient(135deg, #5B8DEF, #34C759)"
                }
              />
              <div style={{ maxWidth: "65%", minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 4,
                    justifyContent: isStaff ? "flex-end" : "flex-start",
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: isInternal
                        ? COLORS.yellow
                        : COLORS.textPrimary,
                    }}
                  >
                    {msg.sender}
                  </span>
                  {isInternal && (
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 3,
                        background: "rgba(255,214,10,0.15)",
                        color: COLORS.yellow,
                        letterSpacing: "0.05em",
                      }}
                    >
                      INTERNAL
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: COLORS.textMuted }}>
                    {formatTime(msg.time)}
                  </span>
                </div>
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: isStaff
                      ? "14px 14px 4px 14px"
                      : "14px 14px 14px 4px",
                    fontSize: 13,
                    lineHeight: 1.6,
                    background: isInternal
                      ? COLORS.internalNote
                      : isStaff
                        ? "rgba(232,93,93,0.12)"
                        : COLORS.card,
                    border: isInternal
                      ? `1px solid ${COLORS.internalNoteBorder}`
                      : `1px solid ${isStaff ? "rgba(232,93,93,0.2)" : COLORS.cardBorder}`,
                    color: COLORS.textPrimary,
                  }}
                >
                  {isInternal && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 6,
                      }}
                    >
                      <Icon name="eye" color={COLORS.yellow} size={12} />
                      <span
                        style={{
                          fontSize: 10,
                          color: COLORS.yellow,
                          fontWeight: 500,
                        }}
                      >
                        Only visible to CCC staff
                      </span>
                    </div>
                  )}
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Compose Area */}
      <div
        style={{
          padding: "16px 24px",
          borderTop: `1px solid ${COLORS.cardBorder}`,
        }}
      >
        {/* Mode Toggle */}
        <div
          style={{
            display: "flex",
            gap: 2,
            marginBottom: 10,
            background: COLORS.card,
            borderRadius: 8,
            padding: 3,
            width: "fit-content",
          }}
        >
          <button
            onClick={() => setMessageMode("reply")}
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: "5px 14px",
              borderRadius: 6,
              border: "none",
              background:
                messageMode === "reply" ? COLORS.coral : "transparent",
              color: messageMode === "reply" ? "#fff" : COLORS.textSecondary,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            Reply to Client
          </button>
          <button
            onClick={() => setMessageMode("internal")}
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: "5px 14px",
              borderRadius: 6,
              border: "none",
              background:
                messageMode === "internal" ? COLORS.yellow : "transparent",
              color:
                messageMode === "internal" ? "#000" : COLORS.textSecondary,
              cursor: "pointer",
              transition: "all 0.15s",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Icon
              name="lock"
              color={
                messageMode === "internal" ? "#000" : COLORS.textSecondary
              }
              size={11}
            />
            Internal Note
          </button>
        </div>

        {/* Input */}
        <div
          style={{
            background:
              messageMode === "internal" ? COLORS.internalNote : COLORS.card,
            border: `1px solid ${messageMode === "internal" ? COLORS.internalNoteBorder : COLORS.cardBorder}`,
            borderRadius: 10,
            padding: "12px 16px",
          }}
        >
          {messageMode === "internal" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 8,
                fontSize: 11,
                color: COLORS.yellow,
              }}
            >
              <Icon name="eye" color={COLORS.yellow} size={12} />
              This note is only visible to CCC staff
            </div>
          )}
          <textarea
            placeholder={
              messageMode === "internal"
                ? "Add an internal note for your team..."
                : `Reply to ${thread.client.companyName}...`
            }
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              color: COLORS.textPrimary,
              fontSize: 13,
              outline: "none",
              resize: "none",
              minHeight: 48,
              lineHeight: 1.5,
            }}
            rows={2}
          />
          {sendError && (
            <div
              style={{
                fontSize: 11,
                color: "#ff4444",
                marginTop: 4,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {sendError}
              <button
                onClick={handleSend}
                style={{
                  fontSize: 11,
                  color: COLORS.coral,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Retry
              </button>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 8,
            }}
          >
            <div style={{ display: "flex", gap: 8 }}>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  borderRadius: 4,
                }}
              >
                <Icon name="paperclip" color={COLORS.textMuted} size={16} />
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={!messageText.trim() || isSending}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 18px",
                borderRadius: 8,
                border: "none",
                background:
                  messageMode === "internal" ? COLORS.yellow : COLORS.coral,
                color: messageMode === "internal" ? "#000" : "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor:
                  !messageText.trim() || isSending
                    ? "not-allowed"
                    : "pointer",
                opacity: !messageText.trim() || isSending ? 0.5 : 1,
              }}
            >
              {messageMode === "internal" ? "Save Note" : "Send"}
              <Icon
                name="send"
                color={messageMode === "internal" ? "#000" : "#fff"}
                size={13}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
