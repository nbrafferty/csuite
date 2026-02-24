"use client";

import { useState, useMemo, useCallback } from "react";
import { Icon } from "@/components/icons";
import { StatusBadge } from "@/components/ui";
import { formatRelativeTime } from "@/lib/time";

const COLORS = {
  card: "#22222A",
  cardBorder: "#333338",
  coral: "#E85D5D",
  textPrimary: "#FFFFFF",
  textSecondary: "#999999",
  textMuted: "#666666",
};

const filterOptions = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "waiting_client", label: "Waiting on Client" },
  { key: "waiting_staff", label: "Waiting on CCC" },
  { key: "resolved", label: "Resolved" },
];

interface ThreadItem {
  id: string;
  client: string;
  orderId: string;
  orderTitle: string;
  subject: string;
  lastMessage: string;
  lastSender: string;
  lastSenderType: string;
  time: string;
  unread: number;
  status: string;
  assignee: string | null;
  hasAttachment: boolean;
}

interface ThreadListProps {
  threads: ThreadItem[];
  selectedThread: string | null;
  onSelectThread: (id: string) => void;
}

export function ThreadList({
  threads,
  selectedThread,
  onSelectThread,
}: ThreadListProps) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredThreads = useMemo(() => {
    let result = threads;

    if (filterStatus !== "all") {
      result = result.filter((t) => t.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.client.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.orderId.toLowerCase().includes(q) ||
          t.lastMessage.toLowerCase().includes(q)
      );
    }

    return result;
  }, [threads, filterStatus, searchQuery]);

  const totalUnread = useMemo(
    () =>
      threads.filter((t) => t.unread > 0).reduce((s, t) => s + t.unread, 0),
    [threads]
  );

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  return (
    <div
      style={{
        width: 380,
        borderRight: `1px solid ${COLORS.cardBorder}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${COLORS.cardBorder}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            Messages
          </h2>
          <span
            style={{ fontSize: 12, color: COLORS.coral, fontWeight: 600 }}
          >
            {totalUnread} unread
          </span>
        </div>

        {/* Search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: COLORS.card,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 8,
            padding: "7px 12px",
            marginBottom: 12,
          }}
        >
          <Icon name="search" color={COLORS.textMuted} size={14} />
          <input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={handleSearch}
            style={{
              background: "transparent",
              border: "none",
              color: COLORS.textPrimary,
              fontSize: 12,
              outline: "none",
              flex: 1,
            }}
          />
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {filterOptions.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              style={{
                fontSize: 11,
                fontWeight: 500,
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid",
                borderColor:
                  filterStatus === f.key ? COLORS.coral : COLORS.cardBorder,
                background:
                  filterStatus === f.key
                    ? "rgba(232,93,93,0.1)"
                    : "transparent",
                color:
                  filterStatus === f.key ? COLORS.coral : COLORS.textSecondary,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Thread List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filteredThreads.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: COLORS.textMuted,
              fontSize: 13,
            }}
          >
            {filterStatus !== "all"
              ? `No ${filterOptions.find((f) => f.key === filterStatus)?.label?.toLowerCase()} conversations found.`
              : "No conversations yet. Threads are created when clients message about their orders."}
          </div>
        ) : (
          filteredThreads.map((t) => (
            <div
              key={t.id}
              onClick={() => onSelectThread(t.id)}
              style={{
                padding: "14px 20px",
                borderBottom: `1px solid ${COLORS.cardBorder}`,
                cursor: "pointer",
                background:
                  selectedThread === t.id
                    ? "rgba(232,93,93,0.06)"
                    : "transparent",
                borderLeft:
                  selectedThread === t.id
                    ? `3px solid ${COLORS.coral}`
                    : "3px solid transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (selectedThread !== t.id)
                  e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              }}
              onMouseLeave={(e) => {
                if (selectedThread !== t.id)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  {t.unread > 0 && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: COLORS.coral,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: t.unread > 0 ? 700 : 500,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.client}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: COLORS.textMuted,
                    flexShrink: 0,
                    marginLeft: 8,
                  }}
                >
                  {formatRelativeTime(t.time)}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: t.unread > 0 ? 600 : 400,
                  color:
                    t.unread > 0 ? COLORS.textPrimary : COLORS.textSecondary,
                  marginBottom: 6,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {t.subject}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: COLORS.textMuted,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginBottom: 8,
                }}
              >
                {t.lastSenderType === "staff"
                  ? `You: ${t.lastMessage}`
                  : t.lastMessage}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <StatusBadge status={t.status} />
                <span style={{ fontSize: 10, color: COLORS.textMuted }}>
                  {t.orderId}
                </span>
                {t.hasAttachment && (
                  <Icon name="paperclip" color={COLORS.textMuted} size={12} />
                )}
                {!t.assignee && (
                  <span
                    style={{
                      fontSize: 10,
                      color: COLORS.coral,
                      fontWeight: 600,
                    }}
                  >
                    Unassigned
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
