"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { ThreadList } from "./thread-list";
import { ChatPanel } from "./chat-panel";
import { ContextSidebar } from "./context-sidebar";
import { MessageSquare } from "lucide-react";

type StatusFilter = "all" | "unread" | "open" | "waiting_on_client" | "waiting_on_ccc" | "resolved";

export function MessagesView() {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  // Local overrides for instant read/unread UI feedback (threadId → isUnread)
  const [readOverrides, setReadOverrides] = useState<Record<string, boolean>>({});

  // Current user
  const { data: me } = trpc.auth.me.useQuery();
  const isStaff = me?.role === "CCC_STAFF";

  // Threads list
  const { data: threadsData } = trpc.thread.list.useQuery(
    {
      status: statusFilter === "all" || statusFilter === "unread" ? undefined : statusFilter,
      unread: statusFilter === "unread" ? true : undefined,
      search: search || undefined,
    },
    { refetchInterval: 15_000 }
  );

  // Apply local read/unread overrides for instant UI feedback
  const threads = (threadsData?.threads ?? []).map((t) => ({
    ...t,
    isUnread: t.id in readOverrides ? readOverrides[t.id] : t.isUnread,
  }));

  // Clean up overrides once server data confirms the change
  // (only remove an override when the server agrees with it)
  useEffect(() => {
    if (!threadsData?.threads) return;
    setReadOverrides((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const id of Object.keys(next)) {
        const serverThread = threadsData.threads.find((t) => t.id === id);
        if (serverThread && serverThread.isUnread === next[id]) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [threadsData]);

  // Selected thread detail
  const { data: threadDetail } = trpc.thread.get.useQuery(
    { id: selectedThreadId! },
    { enabled: !!selectedThreadId }
  );

  // Messages for selected thread
  const { data: messagesData } = trpc.message.list.useQuery(
    { threadId: selectedThreadId! },
    { enabled: !!selectedThreadId, refetchInterval: 10_000 }
  );
  const messages = messagesData?.messages ?? [];

  // Participants
  const { data: participants } = trpc.thread.participants.useQuery(
    { threadId: selectedThreadId! },
    { enabled: !!selectedThreadId }
  );

  // Staff members (for assignment dropdown)
  const { data: companyData } = trpc.company.get.useQuery(undefined, {
    enabled: isStaff,
  });

  // Mutations
  const utils = trpc.useUtils();

  // Helper: directly update the sidebar's unreadCount cache for instant badge feedback
  const adjustUnreadCount = (delta: number) => {
    if (delta === 0) return;
    // Cancel any in-flight unreadCount refetch so a stale response from a
    // previous mutation doesn't overwrite this optimistic value
    utils.thread.unreadCount.cancel();
    utils.thread.unreadCount.setData(undefined, (old) =>
      old != null ? Math.max(0, old + delta) : old
    );
  };

  const markRead = trpc.thread.markRead.useMutation({
    onSettled: () => {
      utils.thread.list.invalidate();
      utils.thread.unreadCount.invalidate();
    },
  });

  const markUnread = trpc.thread.markUnread.useMutation({
    onSettled: () => {
      utils.thread.list.invalidate();
      utils.thread.unreadCount.invalidate();
    },
  });

  const markAllRead = trpc.thread.markAllRead.useMutation({
    onSettled: () => {
      utils.thread.list.invalidate();
      utils.thread.unreadCount.invalidate();
    },
  });

  const sendMessage = trpc.message.send.useMutation({
    onSuccess: () => {
      utils.message.list.invalidate({ threadId: selectedThreadId! });
      utils.thread.list.invalidate();
    },
  });

  const updateStatus = trpc.thread.updateStatus.useMutation({
    onSuccess: () => {
      utils.thread.get.invalidate({ id: selectedThreadId! });
      utils.thread.list.invalidate();
    },
  });

  const assignThread = trpc.thread.assign.useMutation({
    onSuccess: () => {
      utils.thread.get.invalidate({ id: selectedThreadId! });
      utils.thread.list.invalidate();
    },
  });

  const handleSelectThread = (id: string) => {
    setSelectedThreadId(id);
    // Check if this thread is currently shown as unread (respecting any existing override)
    const thread = threadsData?.threads.find((t) => t.id === id);
    const currentlyUnread = id in readOverrides ? readOverrides[id] : thread?.isUnread;
    setReadOverrides((prev) => ({ ...prev, [id]: false }));
    if (currentlyUnread) adjustUnreadCount(-1);
    markRead.mutate({ threadId: id });
  };

  const handleSend = (body: string, senderType: "client" | "staff" | "internal") => {
    if (!selectedThreadId) return;
    sendMessage.mutate({ threadId: selectedThreadId, body, senderType });
  };

  const handleStatusChange = (status: string) => {
    if (!selectedThreadId) return;
    updateStatus.mutate({ id: selectedThreadId, status });
  };

  const handleAssigneeChange = (assigneeId: string | null) => {
    if (!selectedThreadId) return;
    assignThread.mutate({ id: selectedThreadId, assigneeId });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-lg border border-surface-border bg-surface-card">
      {/* Left — Thread List */}
      <ThreadList
        threads={threads}
        selectedThreadId={selectedThreadId}
        onSelectThread={handleSelectThread}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        search={search}
        onSearchChange={setSearch}
        onMarkRead={(id) => {
          const thread = threadsData?.threads.find((t) => t.id === id);
          const currentlyUnread = id in readOverrides ? readOverrides[id] : thread?.isUnread;
          setReadOverrides((prev) => ({ ...prev, [id]: false }));
          if (currentlyUnread) adjustUnreadCount(-1);
          markRead.mutate({ threadId: id });
        }}
        onMarkUnread={(id) => {
          const thread = threadsData?.threads.find((t) => t.id === id);
          const currentlyUnread = id in readOverrides ? readOverrides[id] : thread?.isUnread;
          setReadOverrides((prev) => ({ ...prev, [id]: true }));
          if (!currentlyUnread) adjustUnreadCount(1);
          markUnread.mutate({ threadId: id });
        }}
        onMarkAllRead={() => {
          const overrides: Record<string, boolean> = {};
          let unreadDelta = 0;
          (threadsData?.threads ?? []).forEach((t) => {
            const currentlyUnread = t.id in readOverrides ? readOverrides[t.id] : t.isUnread;
            if (currentlyUnread) {
              overrides[t.id] = false;
              unreadDelta--;
            }
          });
          setReadOverrides((prev) => ({ ...prev, ...overrides }));
          adjustUnreadCount(unreadDelta);
          markAllRead.mutate();
        }}
      />

      {/* Center — Chat Panel */}
      {selectedThreadId && threadDetail ? (
        <ChatPanel
          messages={messages}
          threadSubject={threadDetail.subject}
          onSend={handleSend}
          isSending={sendMessage.isPending}
          isStaff={isStaff}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-foreground-muted" />
            <p className="mt-3 text-sm text-foreground-muted">Select a thread to view messages</p>
          </div>
        </div>
      )}

      {/* Right — Context Sidebar */}
      {selectedThreadId && threadDetail && (
        <ContextSidebar
          thread={threadDetail}
          participants={participants ?? []}
          onStatusChange={handleStatusChange}
          onAssigneeChange={handleAssigneeChange}
          isStaff={isStaff}
          staffMembers={participants?.filter((p) => p.role === "CCC_STAFF") ?? []}
        />
      )}
    </div>
  );
}
