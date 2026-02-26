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

  // Query input matching the thread list query (for optimistic cache updates)
  const listInput = {
    status: statusFilter === "all" || statusFilter === "unread" ? undefined : statusFilter,
    unread: statusFilter === "unread" ? true : undefined,
    search: search || undefined,
  };

  const markRead = trpc.thread.markRead.useMutation({
    onMutate: async ({ threadId }) => {
      await utils.thread.list.cancel();
      await utils.thread.unreadCount.cancel();

      const prevThreads = utils.thread.list.getData(listInput);
      const prevCount = utils.thread.unreadCount.getData();
      const wasUnread = prevThreads?.threads.find((t) => t.id === threadId)?.isUnread;

      utils.thread.list.setData(listInput, (old) => {
        if (!old) return undefined;
        return { ...old, threads: old.threads.map((t) => t.id === threadId ? { ...t, isUnread: false } : t) };
      });

      if (wasUnread) {
        utils.thread.unreadCount.setData(undefined, (old) => old != null ? Math.max(0, old - 1) : old);
      }

      return { prevThreads, prevCount };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevThreads) utils.thread.list.setData(listInput, ctx.prevThreads);
      if (ctx?.prevCount != null) utils.thread.unreadCount.setData(undefined, ctx.prevCount);
    },
    onSettled: invalidateReadState,
  });

  const markUnread = trpc.thread.markUnread.useMutation({
    onMutate: async ({ threadId }) => {
      await utils.thread.list.cancel();
      await utils.thread.unreadCount.cancel();

      const prevThreads = utils.thread.list.getData(listInput);
      const prevCount = utils.thread.unreadCount.getData();
      const wasRead = !prevThreads?.threads.find((t) => t.id === threadId)?.isUnread;

      utils.thread.list.setData(listInput, (old) => {
        if (!old) return undefined;
        return { ...old, threads: old.threads.map((t) => t.id === threadId ? { ...t, isUnread: true } : t) };
      });

      if (wasRead) {
        utils.thread.unreadCount.setData(undefined, (old) => old != null ? old + 1 : old);
      }

      return { prevThreads, prevCount };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevThreads) utils.thread.list.setData(listInput, ctx.prevThreads);
      if (ctx?.prevCount != null) utils.thread.unreadCount.setData(undefined, ctx.prevCount);
    },
    onSettled: invalidateReadState,
  });

  const markAllRead = trpc.thread.markAllRead.useMutation({
    onMutate: async () => {
      await utils.thread.list.cancel();
      await utils.thread.unreadCount.cancel();

      const prevThreads = utils.thread.list.getData(listInput);
      const prevCount = utils.thread.unreadCount.getData();

      utils.thread.list.setData(listInput, (old) => {
        if (!old) return undefined;
        return { ...old, threads: old.threads.map((t) => ({ ...t, isUnread: false })) };
      });

      utils.thread.unreadCount.setData(undefined, () => 0);

      return { prevThreads, prevCount };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevThreads) utils.thread.list.setData(listInput, ctx.prevThreads);
      if (ctx?.prevCount != null) utils.thread.unreadCount.setData(undefined, ctx.prevCount);
    },
    onSettled: invalidateReadState,
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
