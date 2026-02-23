import { useState } from "react";

const COLORS = {
  bg: "#0D0D0F",
  surface: "#1A1A1E",
  card: "#22222A",
  cardBorder: "#333338",
  coral: "#E85D5D",
  green: "#34C759",
  yellow: "#FFD60A",
  blue: "#5B8DEF",
  purple: "#A78BFA",
  textPrimary: "#FFFFFF",
  textSecondary: "#999999",
  textMuted: "#666666",
  internalNote: "#2A2420",
  internalNoteBorder: "#5C4A2E",
};

const Icon = ({ name, color = COLORS.textSecondary, size = 18 }) => {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", style: { flexShrink: 0, display: "block" } };
  const p = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    clients: <><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h.01"/><path d="M9 13h.01"/><path d="M9 17h.01"/></>,
    orders: <><path d="M15 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7Z"/><path d="M14 2v4a2 2 0 002 2h4"/><path d="M8 13h8"/><path d="M8 17h8"/><path d="M8 9h2"/></>,
    production: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    quotes: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></>,
    proofs: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></>,
    messages: <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>,
    invoices: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></>,
    expenses: <><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
    inventory: <><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05"/><path d="M12 22.08V12"/></>,
    vendors: <><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    shipments: <><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
    analytics: <><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></>,
    activity: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    search: <><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></>,
    send: <><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></>,
    paperclip: <><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
    externalLink: <><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><path d="M15 3h6v6"/><path d="M10 14L21 3"/></>,
    filter: <><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    check: <><path d="M20 6L9 17l-5-5"/></>,
    chevronDown: <><path d="M6 9l6 6 6-6"/></>,
    info: <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  };
  return <svg {...props}>{p[name]}</svg>;
};

// ── Mock Data ──
const threads = [
  {
    id: "THR-001",
    client: "Acme Corp",
    orderId: "CS-9012",
    orderTitle: "Summer Tees 2026",
    subject: "Logo placement on back panel",
    lastMessage: "I've attached the updated mockup with the revised logo position. Can you confirm this works?",
    lastSender: "Sarah M.",
    lastSenderType: "staff",
    time: "2 min ago",
    unread: 2,
    status: "waiting_client",
    assignee: "Sarah M.",
    hasAttachment: true,
  },
  {
    id: "THR-002",
    client: "Bloom Studio",
    orderId: "CS-8991",
    orderTitle: "Brand Refresh Hoodies",
    subject: "Thread color change request",
    lastMessage: "Can we change the thread color to navy? The current charcoal doesn't match our brand guide.",
    lastSender: "Lisa Chen",
    lastSenderType: "client",
    time: "12 min ago",
    unread: 1,
    status: "open",
    assignee: "Sarah M.",
    hasAttachment: false,
  },
  {
    id: "THR-003",
    client: "Redline Events",
    orderId: "CS-8960",
    orderTitle: "Event Banners Q1",
    subject: "Delivery timeline for March event",
    lastMessage: "We need these by March 8th at the latest. Is that still on track?",
    lastSender: "Tom Rivera",
    lastSenderType: "client",
    time: "34 min ago",
    unread: 3,
    status: "open",
    assignee: null,
    hasAttachment: false,
  },
  {
    id: "THR-004",
    client: "NovaTech",
    orderId: "CS-8974",
    orderTitle: "Conference Merch Pack",
    subject: "Sizing question — unisex vs fitted",
    lastMessage: "Do you have a sizing chart for the unisex cut? We want to make sure we order the right split.",
    lastSender: "Mike Park",
    lastSenderType: "client",
    time: "2 hrs ago",
    unread: 1,
    status: "open",
    assignee: null,
    hasAttachment: false,
  },
  {
    id: "THR-005",
    client: "Greenfield Co",
    orderId: "CS-9008",
    orderTitle: "Eco Tote Bags",
    subject: "Proof annotation — ink color off",
    lastMessage: "The green in the proof looks too lime. We need it closer to Pantone 349C.",
    lastSender: "Dana Kim",
    lastSenderType: "client",
    time: "3 hrs ago",
    unread: 0,
    status: "waiting_staff",
    assignee: "Alex K.",
    hasAttachment: true,
  },
  {
    id: "THR-006",
    client: "Acme Corp",
    orderId: "CS-8945",
    orderTitle: "Holiday Gift Boxes",
    subject: "Shipping address update",
    lastMessage: "Thanks for confirming. We'll update the shipping label and have it out tomorrow.",
    lastSender: "Jordan R.",
    lastSenderType: "staff",
    time: "5 hrs ago",
    unread: 0,
    status: "resolved",
    assignee: "Jordan R.",
    hasAttachment: false,
  },
];

const activeMessages = [
  {
    id: 1,
    sender: "Lisa Chen",
    senderType: "client",
    avatar: "LC",
    time: "10:22 AM",
    text: "Hi! We just got the proof back for the Brand Refresh Hoodies order. The overall layout looks great, but I noticed the thread color on the embroidery is charcoal — our brand guide specifies navy (Pantone 289C). Can we get that changed before we approve?",
  },
  {
    id: 2,
    sender: "Sarah M.",
    senderType: "staff",
    avatar: "SM",
    time: "10:35 AM",
    text: "Hi Lisa! Thanks for catching that. I'll have the production team update the thread color to Pantone 289C and re-render the proof. Should have a new version for you by end of day.",
  },
  {
    id: 3,
    sender: "Sarah M.",
    senderType: "internal",
    avatar: "SM",
    time: "10:36 AM",
    text: "Note to team: Check if we have navy 289C thread in stock. If not, we may need to order from Superior Threads — lead time is 2 days. @Alex can you confirm inventory?",
  },
  {
    id: 4,
    sender: "Lisa Chen",
    senderType: "client",
    avatar: "LC",
    time: "11:02 AM",
    text: "Perfect, thank you! Also — can we change the thread color to navy on the cuffs too? I want everything consistent.",
  },
  {
    id: 5,
    sender: "Alex K.",
    senderType: "internal",
    avatar: "AK",
    time: "11:15 AM",
    text: "Checked inventory — we have 289C in stock, 4 spools. That's enough for this run. No need to reorder.",
  },
];

const statusConfig = {
  open: { label: "Open", color: COLORS.coral, bg: "rgba(232,93,93,0.12)" },
  waiting_client: { label: "Waiting on Client", color: COLORS.yellow, bg: "rgba(255,214,10,0.1)" },
  waiting_staff: { label: "Waiting on CCC", color: COLORS.blue, bg: "rgba(91,141,239,0.12)" },
  resolved: { label: "Resolved", color: COLORS.green, bg: "rgba(52,199,89,0.12)" },
};

const navItems = [
  { label: "Dashboard", icon: "dashboard" },
  { label: "Clients", icon: "clients" },
  { label: "Order Queue", icon: "orders" },
  { label: "Production", icon: "production" },
  { label: "Quotes", icon: "quotes" },
  { label: "Proofs", icon: "proofs" },
  { label: "Messages", icon: "messages", active: true, badge: 7 },
  { label: "Invoices", icon: "invoices" },
  { label: "Expenses", icon: "expenses" },
  { label: "Inventory", icon: "inventory" },
  { label: "Vendors", icon: "vendors" },
  { label: "Shipments", icon: "shipments" },
  { label: "Analytics", icon: "analytics" },
  { label: "Recent Activity", icon: "activity" },
];

function StatusBadge({ status }) {
  const c = statusConfig[status];
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4, background: c.bg, color: c.color, letterSpacing: "0.03em", whiteSpace: "nowrap" }}>
      {c.label}
    </span>
  );
}

function Avatar({ initials, size = 32, bg = "linear-gradient(135deg, #E85D5D, #A78BFA)" }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.375, fontWeight: 700, flexShrink: 0, color: "#fff" }}>
      {initials}
    </div>
  );
}

export default function AdminMessages() {
  const [collapsed, setCollapsed] = useState(true);
  const [selectedThread, setSelectedThread] = useState("THR-002");
  const [filterStatus, setFilterStatus] = useState("all");
  const [messageMode, setMessageMode] = useState("reply"); // "reply" | "internal"
  const [showContext, setShowContext] = useState(true);

  const filteredThreads = filterStatus === "all" ? threads : threads.filter(t => t.status === filterStatus);
  const active = threads.find(t => t.id === selectedThread);

  return (
    <div style={{ display: "flex", height: "100vh", background: COLORS.bg, color: COLORS.textPrimary, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", overflow: "hidden" }}>
      {/* Sidebar — collapsed by default on messages page for more room */}
      <aside style={{
        width: collapsed ? 64 : 260,
        background: COLORS.surface,
        borderRight: `1px solid ${COLORS.cardBorder}`,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s ease",
        flexShrink: 0,
        overflow: "hidden",
      }}>
        <div style={{ padding: "20px 14px", borderBottom: `1px solid ${COLORS.cardBorder}`, display: "flex", alignItems: "center", gap: 12, minHeight: 72 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: COLORS.coral, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, flexShrink: 0, color: "#fff" }}>CC</div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Central Creative</div>
              <div style={{ fontSize: 11, color: COLORS.coral, fontWeight: 600 }}>STAFF PORTAL</div>
            </div>
          )}
        </div>
        <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
          {navItems.map((item) => (
            <div key={item.label} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: collapsed ? "10px 16px" : "10px 14px",
              marginBottom: 2, borderRadius: 8, cursor: "pointer",
              background: item.active ? "rgba(232,93,93,0.1)" : "transparent",
              color: item.active ? COLORS.coral : COLORS.textSecondary,
              fontSize: 13, fontWeight: item.active ? 600 : 400,
              transition: "background 0.15s", position: "relative",
            }}>
              <Icon name={item.icon} color={item.active ? COLORS.coral : COLORS.textSecondary} />
              {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
              {!collapsed && item.badge && (
                <span style={{ fontSize: 10, fontWeight: 700, background: COLORS.coral, color: "#fff", borderRadius: 10, padding: "2px 7px" }}>{item.badge}</span>
              )}
              {collapsed && item.badge && (
                <span style={{ position: "absolute", top: 6, right: 10, width: 8, height: 8, borderRadius: "50%", background: COLORS.coral }} />
              )}
            </div>
          ))}
        </nav>
        <div style={{ padding: 16, borderTop: `1px solid ${COLORS.cardBorder}`, cursor: "pointer", textAlign: "center" }} onClick={() => setCollapsed(!collapsed)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={COLORS.textMuted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? <path d="M9 18l6-6-6-6"/> : <path d="M15 18l-6-6 6-6"/>}
          </svg>
        </div>
      </aside>

      {/* ── Thread List Panel ── */}
      <div style={{ width: 380, borderRight: `1px solid ${COLORS.cardBorder}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.cardBorder}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Messages</h2>
            <span style={{ fontSize: 12, color: COLORS.coral, fontWeight: 600 }}>
              {threads.filter(t => t.unread > 0).reduce((s, t) => s + t.unread, 0)} unread
            </span>
          </div>
          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: "7px 12px", marginBottom: 12 }}>
            <Icon name="search" color={COLORS.textMuted} size={14} />
            <input placeholder="Search conversations..." style={{ background: "transparent", border: "none", color: COLORS.textPrimary, fontSize: 12, outline: "none", flex: 1 }} />
          </div>
          {/* Filter pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { key: "all", label: "All" },
              { key: "open", label: "Open" },
              { key: "waiting_client", label: "Waiting on Client" },
              { key: "waiting_staff", label: "Waiting on CCC" },
              { key: "resolved", label: "Resolved" },
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                style={{
                  fontSize: 11, fontWeight: 500, padding: "4px 10px", borderRadius: 6, border: "1px solid",
                  borderColor: filterStatus === f.key ? COLORS.coral : COLORS.cardBorder,
                  background: filterStatus === f.key ? "rgba(232,93,93,0.1)" : "transparent",
                  color: filterStatus === f.key ? COLORS.coral : COLORS.textSecondary,
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Thread List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filteredThreads.map(t => (
            <div
              key={t.id}
              onClick={() => setSelectedThread(t.id)}
              style={{
                padding: "14px 20px",
                borderBottom: `1px solid ${COLORS.cardBorder}`,
                cursor: "pointer",
                background: selectedThread === t.id ? "rgba(232,93,93,0.06)" : "transparent",
                borderLeft: selectedThread === t.id ? `3px solid ${COLORS.coral}` : "3px solid transparent",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => { if (selectedThread !== t.id) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
              onMouseLeave={e => { if (selectedThread !== t.id) e.currentTarget.style.background = "transparent"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  {t.unread > 0 && <span style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.coral, flexShrink: 0 }} />}
                  <span style={{ fontSize: 13, fontWeight: t.unread > 0 ? 700 : 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.client}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: COLORS.textMuted, flexShrink: 0, marginLeft: 8 }}>{t.time}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: t.unread > 0 ? 600 : 400, color: t.unread > 0 ? COLORS.textPrimary : COLORS.textSecondary, marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {t.subject}
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 8 }}>
                {t.lastSenderType === "staff" ? `You: ${t.lastMessage}` : t.lastMessage}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <StatusBadge status={t.status} />
                <span style={{ fontSize: 10, color: COLORS.textMuted }}>{t.orderId}</span>
                {t.hasAttachment && <Icon name="paperclip" color={COLORS.textMuted} size={12} />}
                {!t.assignee && <span style={{ fontSize: 10, color: COLORS.coral, fontWeight: 600 }}>Unassigned</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Chat Panel ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {active ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: "14px 24px", borderBottom: `1px solid ${COLORS.cardBorder}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
                <Avatar initials={active.client.split(" ").map(w => w[0]).join("")} size={40} bg="linear-gradient(135deg, #5B8DEF, #A78BFA)" />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{active.subject}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                    <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{active.client}</span>
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>·</span>
                    <StatusBadge status={active.status} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => setShowContext(!showContext)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6,
                    border: `1px solid ${COLORS.cardBorder}`, background: showContext ? "rgba(232,93,93,0.08)" : "transparent",
                    color: showContext ? COLORS.coral : COLORS.textSecondary, cursor: "pointer", fontSize: 12, fontWeight: 500,
                  }}
                >
                  <Icon name="info" color={showContext ? COLORS.coral : COLORS.textSecondary} size={14} />
                  Details
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 16px" }}>
              {activeMessages.map(msg => {
                const isInternal = msg.senderType === "internal";
                const isStaff = msg.senderType === "staff" || isInternal;
                return (
                  <div key={msg.id} style={{ display: "flex", gap: 12, marginBottom: 20, flexDirection: isStaff ? "row-reverse" : "row" }}>
                    <Avatar
                      initials={msg.avatar}
                      size={32}
                      bg={isStaff ? "linear-gradient(135deg, #E85D5D, #A78BFA)" : "linear-gradient(135deg, #5B8DEF, #34C759)"}
                    />
                    <div style={{ maxWidth: "65%", minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, justifyContent: isStaff ? "flex-end" : "flex-start" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: isInternal ? COLORS.yellow : COLORS.textPrimary }}>
                          {msg.sender}
                        </span>
                        {isInternal && (
                          <span style={{ fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 3, background: "rgba(255,214,10,0.15)", color: COLORS.yellow, letterSpacing: "0.05em" }}>
                            INTERNAL
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: COLORS.textMuted }}>{msg.time}</span>
                      </div>
                      <div style={{
                        padding: "12px 16px",
                        borderRadius: isStaff ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                        fontSize: 13, lineHeight: 1.6,
                        background: isInternal ? COLORS.internalNote : isStaff ? "rgba(232,93,93,0.12)" : COLORS.card,
                        border: isInternal ? `1px solid ${COLORS.internalNoteBorder}` : `1px solid ${isStaff ? "rgba(232,93,93,0.2)" : COLORS.cardBorder}`,
                        color: COLORS.textPrimary,
                      }}>
                        {isInternal && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <Icon name="eye" color={COLORS.yellow} size={12} />
                            <span style={{ fontSize: 10, color: COLORS.yellow, fontWeight: 500 }}>Only visible to CCC staff</span>
                          </div>
                        )}
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Compose Area */}
            <div style={{ padding: "16px 24px", borderTop: `1px solid ${COLORS.cardBorder}` }}>
              {/* Mode Toggle */}
              <div style={{ display: "flex", gap: 2, marginBottom: 10, background: COLORS.card, borderRadius: 8, padding: 3, width: "fit-content" }}>
                <button
                  onClick={() => setMessageMode("reply")}
                  style={{
                    fontSize: 12, fontWeight: 500, padding: "5px 14px", borderRadius: 6, border: "none",
                    background: messageMode === "reply" ? COLORS.coral : "transparent",
                    color: messageMode === "reply" ? "#fff" : COLORS.textSecondary,
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  Reply to Client
                </button>
                <button
                  onClick={() => setMessageMode("internal")}
                  style={{
                    fontSize: 12, fontWeight: 500, padding: "5px 14px", borderRadius: 6, border: "none",
                    background: messageMode === "internal" ? COLORS.yellow : "transparent",
                    color: messageMode === "internal" ? "#000" : COLORS.textSecondary,
                    cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 5,
                  }}
                >
                  <Icon name="lock" color={messageMode === "internal" ? "#000" : COLORS.textSecondary} size={11} />
                  Internal Note
                </button>
              </div>
              {/* Input */}
              <div style={{
                background: messageMode === "internal" ? COLORS.internalNote : COLORS.card,
                border: `1px solid ${messageMode === "internal" ? COLORS.internalNoteBorder : COLORS.cardBorder}`,
                borderRadius: 10, padding: "12px 16px",
              }}>
                {messageMode === "internal" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontSize: 11, color: COLORS.yellow }}>
                    <Icon name="eye" color={COLORS.yellow} size={12} />
                    This note is only visible to CCC staff
                  </div>
                )}
                <textarea
                  placeholder={messageMode === "internal" ? "Add an internal note for your team..." : `Reply to ${active.client}...`}
                  style={{
                    width: "100%", background: "transparent", border: "none", color: COLORS.textPrimary,
                    fontSize: 13, outline: "none", resize: "none", minHeight: 48, lineHeight: 1.5,
                  }}
                  rows={2}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4, borderRadius: 4 }}>
                      <Icon name="paperclip" color={COLORS.textMuted} size={16} />
                    </button>
                  </div>
                  <button style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8, border: "none",
                    background: messageMode === "internal" ? COLORS.yellow : COLORS.coral,
                    color: messageMode === "internal" ? "#000" : "#fff",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}>
                    {messageMode === "internal" ? "Save Note" : "Send"}
                    <Icon name="send" color={messageMode === "internal" ? "#000" : "#fff"} size={13} />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMuted }}>
            <div style={{ textAlign: "center" }}>
              <Icon name="messages" color={COLORS.textMuted} size={48} />
              <div style={{ marginTop: 16, fontSize: 14 }}>Select a conversation</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Context Sidebar ── */}
      {showContext && active && (
        <div style={{ width: 300, borderLeft: `1px solid ${COLORS.cardBorder}`, background: COLORS.surface, overflowY: "auto", flexShrink: 0 }}>
          <div style={{ padding: "20px 20px 16px" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>Thread Details</h3>

            {/* Linked Order */}
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 10, padding: 14, marginBottom: 16, cursor: "pointer", transition: "border-color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.coral}
              onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.cardBorder}
            >
              <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Linked Order</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{active.orderId}</div>
                  <div style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>{active.orderTitle}</div>
                </div>
                <Icon name="externalLink" color={COLORS.coral} size={14} />
              </div>
            </div>

            {/* Assignment */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Assigned To</div>
              {active.assignee ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar initials={active.assignee.split(" ").map(w => w[0]).join("")} size={28} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{active.assignee}</span>
                </div>
              ) : (
                <button style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6,
                  border: `1px dashed ${COLORS.coral}`, background: "rgba(232,93,93,0.06)", color: COLORS.coral,
                  cursor: "pointer", fontSize: 12, fontWeight: 500,
                }}>
                  <Icon name="user" color={COLORS.coral} size={13} />
                  Assign to staff
                </button>
              )}
            </div>

            {/* Status */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Status</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <div
                    key={key}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6,
                      background: active.status === key ? cfg.bg : "transparent",
                      cursor: "pointer", transition: "background 0.15s",
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: active.status === key ? cfg.color : COLORS.textSecondary, fontWeight: active.status === key ? 600 : 400 }}>
                      {cfg.label}
                    </span>
                    {active.status === key && <Icon name="check" color={cfg.color} size={13} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Client Info */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Client</div>
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.cardBorder}`, borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{active.client}</div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 8 }}>
                  {active.lastSenderType === "client" ? active.lastSender : "Lisa Chen"} · Client Admin
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(91,141,239,0.1)", color: COLORS.blue }}>5 active orders</span>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(52,199,89,0.1)", color: COLORS.green }}>Good standing</span>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Participants</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { name: "Lisa Chen", role: "Client Admin", type: "client" },
                  { name: "Sarah M.", role: "CCC Staff", type: "staff" },
                  { name: "Alex K.", role: "CCC Staff", type: "staff" },
                ].map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar
                      initials={p.name.split(" ").map(w => w[0]).join("")}
                      size={24}
                      bg={p.type === "staff" ? "linear-gradient(135deg, #E85D5D, #A78BFA)" : "linear-gradient(135deg, #5B8DEF, #34C759)"}
                    />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: COLORS.textMuted }}>{p.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Actions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {[
                  { label: "View Order Details", icon: "externalLink" },
                  { label: "View Proof", icon: "proofs" },
                  { label: "Mark as Resolved", icon: "check" },
                ].map((a, i) => (
                  <button key={i} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 6,
                    border: `1px solid ${COLORS.cardBorder}`, background: "transparent", color: COLORS.textSecondary,
                    cursor: "pointer", fontSize: 12, fontWeight: 400, width: "100%", textAlign: "left", transition: "background 0.15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <Icon name={a.icon} color={COLORS.textSecondary} size={14} />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
