"use client";

import { useState } from "react";
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
  const threads = threadsData?.threads ?? [];

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

  const invalidateReadState = () => {
    utils.thread.list.invalidate();
    utils.thread.unreadCount.invalidate();
  };

  const markRead = trpc.thread.markRead.useMutation({
    onSuccess: invalidateReadState,
  });

  const markUnread = trpc.thread.markUnread.useMutation({
    onSuccess: invalidateReadState,
  });

  const markAllRead = trpc.thread.markAllRead.useMutation({
    onSuccess: invalidateReadState,
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
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-lg border border-surface-border bg-surface-bg">
      {/* Left — Thread List */}
      <ThreadList
        threads={threads}
        selectedThreadId={selectedThreadId}
        onSelectThread={handleSelectThread}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        search={search}
        onSearchChange={setSearch}
        onMarkRead={(id) => markRead.mutate({ threadId: id })}
        onMarkUnread={(id) => markUnread.mutate({ threadId: id })}
        onMarkAllRead={() => markAllRead.mutate()}
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
