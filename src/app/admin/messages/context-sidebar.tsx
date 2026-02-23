"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { Avatar, statusConfig } from "@/components/ui";

const COLORS = {
  surface: "#1A1A1E",
  card: "#22222A",
  cardBorder: "#333338",
  coral: "#E85D5D",
  green: "#34C759",
  blue: "#5B8DEF",
  textPrimary: "#FFFFFF",
  textSecondary: "#999999",
  textMuted: "#666666",
};

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

interface Participant {
  id: string;
  name: string;
  role: string;
  type: string;
}

interface ContextSidebarProps {
  thread: ThreadDetail;
  participants: Participant[];
  staffUsers: { id: string; name: string }[];
  onUpdateStatus: (status: string) => void;
  onAssign: (userId: string | null) => void;
}

export function ContextSidebar({
  thread,
  participants,
  staffUsers,
  onUpdateStatus,
  onAssign,
}: ContextSidebarProps) {
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [confirmResolve, setConfirmResolve] = useState(false);

  const handleStatusClick = (status: string) => {
    if (status === "resolved" && thread.status !== "resolved") {
      setConfirmResolve(true);
      return;
    }
    onUpdateStatus(status);
  };

  const handleConfirmResolve = () => {
    onUpdateStatus("resolved");
    setConfirmResolve(false);
  };

  const billingStatusColor =
    thread.client.billingStatus === "good"
      ? COLORS.green
      : thread.client.billingStatus === "overdue"
        ? "#FFD60A"
        : "#ff4444";

  const billingStatusBg =
    thread.client.billingStatus === "good"
      ? "rgba(52,199,89,0.1)"
      : thread.client.billingStatus === "overdue"
        ? "rgba(255,214,10,0.1)"
        : "rgba(255,68,68,0.1)";

  return (
    <div
      style={{
        width: 300,
        borderLeft: `1px solid ${COLORS.cardBorder}`,
        background: COLORS.surface,
        overflowY: "auto",
        flexShrink: 0,
      }}
    >
      <div style={{ padding: "20px 20px 16px" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>
          Thread Details
        </h3>

        {/* Linked Order */}
        <div
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.cardBorder}`,
            borderRadius: 10,
            padding: 14,
            marginBottom: 16,
            cursor: "pointer",
            transition: "border-color 0.15s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = COLORS.coral)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = COLORS.cardBorder)
          }
        >
          <div
            style={{
              fontSize: 10,
              color: COLORS.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 6,
            }}
          >
            Linked Order
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {thread.orderId}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: COLORS.textSecondary,
                  marginTop: 2,
                }}
              >
                {thread.orderTitle}
              </div>
            </div>
            <Icon name="externalLink" color={COLORS.coral} size={14} />
          </div>
        </div>

        {/* Assignment */}
        <div style={{ marginBottom: 20, position: "relative" }}>
          <div
            style={{
              fontSize: 10,
              color: COLORS.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            Assigned To
          </div>
          {thread.assignee ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
              }}
              onClick={() => setShowAssignDropdown(!showAssignDropdown)}
            >
              <Avatar
                initials={thread.assignee.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")}
                size={28}
              />
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {thread.assignee.name}
              </span>
            </div>
          ) : (
            <button
              onClick={() => setShowAssignDropdown(!showAssignDropdown)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 6,
                border: `1px dashed ${COLORS.coral}`,
                background: "rgba(232,93,93,0.06)",
                color: COLORS.coral,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <Icon name="user" color={COLORS.coral} size={13} />
              Assign to staff
            </button>
          )}

          {/* Assignment Dropdown */}
          {showAssignDropdown && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: 4,
                background: COLORS.card,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 8,
                padding: 4,
                zIndex: 10,
              }}
            >
              {staffUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => {
                    onAssign(user.id);
                    setShowAssignDropdown(false);
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 12,
                    color: COLORS.textPrimary,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {user.name}
                </div>
              ))}
              {thread.assignee && (
                <div
                  onClick={() => {
                    onAssign(null);
                    setShowAssignDropdown(false);
                  }}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 12,
                    color: COLORS.coral,
                    borderTop: `1px solid ${COLORS.cardBorder}`,
                    marginTop: 4,
                    paddingTop: 10,
                  }}
                >
                  Unassign
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              color: COLORS.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            Status
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <div
                key={key}
                onClick={() => handleStatusClick(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 10px",
                  borderRadius: 6,
                  background: thread.status === key ? cfg.bg : "transparent",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: cfg.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    color:
                      thread.status === key ? cfg.color : COLORS.textSecondary,
                    fontWeight: thread.status === key ? 600 : 400,
                  }}
                >
                  {cfg.label}
                </span>
                {thread.status === key && (
                  <Icon name="check" color={cfg.color} size={13} />
                )}
              </div>
            ))}
          </div>

          {/* Resolve confirmation */}
          {confirmResolve && (
            <div
              style={{
                marginTop: 8,
                padding: 12,
                background: COLORS.card,
                border: `1px solid ${COLORS.cardBorder}`,
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: COLORS.textPrimary,
                  marginBottom: 8,
                }}
              >
                Mark this thread as resolved?
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleConfirmResolve}
                  style={{
                    fontSize: 11,
                    padding: "4px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: COLORS.green,
                    color: "#fff",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmResolve(false)}
                  style={{
                    fontSize: 11,
                    padding: "4px 12px",
                    borderRadius: 6,
                    border: `1px solid ${COLORS.cardBorder}`,
                    background: "transparent",
                    color: COLORS.textSecondary,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Client Info */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              color: COLORS.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            Client
          </div>
          <div
            style={{
              background: COLORS.card,
              border: `1px solid ${COLORS.cardBorder}`,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
              {thread.client.companyName}
            </div>
            <div
              style={{
                fontSize: 11,
                color: COLORS.textSecondary,
                marginBottom: 8,
              }}
            >
              {thread.client.primaryContact} · Client Admin
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: "rgba(91,141,239,0.1)",
                  color: COLORS.blue,
                }}
              >
                {thread.client.activeOrderCount} active orders
              </span>
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: billingStatusBg,
                  color: billingStatusColor,
                  textTransform: "capitalize",
                }}
              >
                {thread.client.billingStatus === "good"
                  ? "Good standing"
                  : thread.client.billingStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              color: COLORS.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            Participants
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {participants.map((p) => (
              <div
                key={p.id}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <Avatar
                  initials={p.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                  size={24}
                  bg={
                    p.type === "staff"
                      ? "linear-gradient(135deg, #E85D5D, #A78BFA)"
                      : "linear-gradient(135deg, #5B8DEF, #34C759)"
                  }
                />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted }}>
                    {p.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div
            style={{
              fontSize: 10,
              color: COLORS.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 8,
            }}
          >
            Actions
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              { label: "View Order Details", icon: "externalLink" },
              { label: "View Proof", icon: "proofs" },
              {
                label: "Mark as Resolved",
                icon: "check",
                onClick: () => handleStatusClick("resolved"),
              },
            ].map((a, i) => (
              <button
                key={i}
                onClick={a.onClick}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 10px",
                  borderRadius: 6,
                  border: `1px solid ${COLORS.cardBorder}`,
                  background: "transparent",
                  color: COLORS.textSecondary,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 400,
                  width: "100%",
                  textAlign: "left" as const,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.03)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <Icon name={a.icon} color={COLORS.textSecondary} size={14} />
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
