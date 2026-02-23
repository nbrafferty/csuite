# Admin Messages Page — Behavior Spec

## Reference Artifact
`admin-messages.jsx` — React prototype with mock data. Use as the visual/layout reference. Reuse the color palette, icon system, and component patterns from the admin dashboard.

---

## Layout

Three-panel layout (no page scroll — panels scroll independently):

| Panel | Width | Scroll |
|-------|-------|--------|
| Sidebar nav | 64px collapsed (default on this page) / 260px expanded | nav items only |
| Thread list | 380px fixed | vertical, thread list only |
| Chat area | flex: 1 (fills remaining) | vertical, messages only |
| Context sidebar | 300px, toggleable via "Details" button | vertical |

---

## Thread List (Left Panel)

### Data Source
- `GET /threads` — returns all threads across all tenants (CCC staff only)
- Default sort: most recent message first
- Include: `unreadCount`, `status`, `assigneeId`, `orderId`, `lastMessage`, `lastSenderType`

### Filters
- **Status pills**: All, Open, Waiting on Client, Waiting on CCC, Resolved
  - "All" is default
  - Filters are client-side on the loaded list (paginate server-side if > 50 threads)
- **Search**: Filters by client name, subject, order ID, message content (debounced, 300ms)
- **Unread count** in header updates dynamically based on visible threads

### Thread Item Behavior
- Click → loads thread messages in chat panel + updates context sidebar
- **Selected state**: left coral border + subtle coral bg
- **Unread indicator**: coral dot before client name, bold subject
- Clicking a thread marks it as read (`POST /threads/:id/read`)
- Show "Unassigned" label in coral if `assigneeId` is null
- Show paperclip icon if any message in thread has attachments

### Thread Statuses (state machine)
```
Open → Waiting on Client (staff replies)
Open → Waiting on CCC (client replies)  
Waiting on Client → Open (client replies)
Waiting on CCC → Open (staff replies)
Any → Resolved (manual action)
Resolved → Open (new message from either side)
```
- Status auto-updates when messages are sent
- "Mark as Resolved" is a manual action in the context sidebar

---

## Chat Area (Center Panel)

### Message Loading
- `GET /threads/:id/messages` — returns all messages for the thread
- Messages include: `id`, `senderId`, `senderName`, `senderType` (client | staff | internal), `text`, `attachments[]`, `createdAt`
- Auto-scroll to bottom on load and new message

### Message Rendering
- **Client messages**: left-aligned, dark card bg, rounded with bottom-left flat corner
- **Staff messages**: right-aligned, coral-tinted bg, rounded with bottom-right flat corner
- **Internal notes**: right-aligned, amber/warm bg with dashed-ish border, "INTERNAL" badge, eye icon + "Only visible to CCC staff" label
- Show sender avatar (initials), name, timestamp on each message
- Internal notes are **never** returned to client API calls — filter server-side by role

### Compose Area
- **Two modes** toggled by segmented control:
  1. **Reply to Client** (default): coral send button, sends `POST /threads/:id/messages` with `type: "reply"`
  2. **Internal Note**: yellow save button, warm amber input bg, lock icon, sends `POST /threads/:id/messages` with `type: "internal"`
- Attach files via paperclip button → opens file picker → uploads to `/artwork/upload` → attaches to message
- Enter key: does NOT send (multiline input). Send button or Cmd+Enter sends.
- Empty message: send button disabled
- After sending: clear input, append message optimistically, scroll to bottom

---

## Context Sidebar (Right Panel)

### Toggle
- "Details" button in chat header toggles visibility
- Default: **visible**
- State persists during session (not across page loads)

### Sections

**Linked Order**
- Shows `orderId` and `orderTitle` from the thread
- Click navigates to `/orders/:orderId` (order detail page)
- Hover: coral border highlight

**Assigned To**
- Shows current assignee avatar + name
- If unassigned: show "Assign to staff" button (dashed coral border)
- Click "Assign to staff" → dropdown of CCC staff users → `PATCH /threads/:id` with `assigneeId`
- Self-assign shortcut: assign to current logged-in user

**Status**
- Radio-style list of all 4 statuses
- Current status has filled dot + check icon
- Click a different status → `PATCH /threads/:id` with `status`
- "Resolved" prompts: "Mark this thread as resolved?" (confirm/cancel)

**Client Info**
- Client company name, primary contact name + role
- Active order count (from tenant data)
- Account standing badge (from billing status)

**Participants**
- List of all users who have sent messages in this thread
- Show avatar, name, role (Client Admin / CCC Staff)
- Staff-only participants (internal note authors) show to staff but NOT to clients

**Quick Actions**
- "View Order Details" → navigates to `/orders/:orderId`
- "View Proof" → navigates to `/orders/:orderId/proofs` (only show if order has proofs)
- "Mark as Resolved" → same as clicking Resolved in status section

---

## Permissions

| Action | Client Admin | Client User | CCC Staff |
|--------|:---:|:---:|:---:|
| View own tenant's threads | ✅ | ✅ | ✅ (all tenants) |
| Send reply | ✅ | ✅ | ✅ |
| Send internal note | ❌ | ❌ | ✅ |
| See internal notes | ❌ | ❌ | ✅ |
| Change thread status | ❌ | ❌ | ✅ |
| Assign thread | ❌ | ❌ | ✅ |
| View context sidebar | ❌ | ❌ | ✅ |

---

## API Endpoints Needed

```
GET    /threads                    — list threads (staff: all, client: own tenant)
GET    /threads/:id/messages       — list messages (filter internal notes for clients)
POST   /threads/:id/messages       — send message { type: "reply" | "internal", text, attachments[] }
PATCH  /threads/:id                — update status, assigneeId
POST   /threads/:id/read           — mark thread as read
POST   /threads                    — create new thread { subject, orderId, text }
```

---

## Real-time (future, not MVP)
- For MVP: poll every 15 seconds for new messages on the active thread
- For MVP: poll every 60 seconds for thread list updates (new threads, unread counts)
- Future: WebSocket for instant message delivery

---

## Empty States
- **No threads**: "No conversations yet. Threads are created when clients message about their orders."
- **No threads matching filter**: "No [status] conversations found."
- **No thread selected**: Message icon + "Select a conversation" (already in artifact)

---

## Error States
- **Message send failure**: Show red inline error below compose area, keep message in input, show "Retry" button
- **Thread load failure**: Show error in chat area with "Try again" button
- **Network offline**: Show yellow banner at top of chat: "You're offline. Messages will send when reconnected."
