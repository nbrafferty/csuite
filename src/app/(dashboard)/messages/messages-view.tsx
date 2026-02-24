"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { ThreadList } from "./thread-list";
import { ChatPanel } from "./chat-panel";
import { ContextSidebar } from "./context-sidebar";

export function MessagesView() {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [showContext, setShowContext] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // Fetch threads with polling (60s)
  const threadsQuery = trpc.thread.list.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  // Fetch selected thread details
  const threadDetailQuery = trpc.thread.getById.useQuery(
    { id: selectedThreadId! },
    { enabled: !!selectedThreadId }
  );

  // Fetch messages for selected thread with polling (15s)
  const messagesQuery = trpc.message.list.useQuery(
    { threadId: selectedThreadId! },
    {
      enabled: !!selectedThreadId,
      refetchInterval: 15_000,
    }
  );

  // Fetch participants for selected thread
  const participantsQuery = trpc.message.getParticipants.useQuery(
    { threadId: selectedThreadId! },
    { enabled: !!selectedThreadId }
  );

  // Fetch staff users for assignment dropdown
  const staffUsersQuery = trpc.thread.getStaffUsers.useQuery();

  // Mutations
  const markReadMutation = trpc.thread.markRead.useMutation();

  const sendMessageMutation = trpc.message.send.useMutation({
    onSuccess: () => {
      setSendError(null);
      utils.message.list.invalidate({ threadId: selectedThreadId! });
      utils.thread.list.invalidate();
      utils.thread.getById.invalidate({ id: selectedThreadId! });
      utils.message.getParticipants.invalidate({ threadId: selectedThreadId! });
    },
    onError: () => {
      setSendError("Failed to send message. Please try again.");
    },
  });

  const updateThreadMutation = trpc.thread.update.useMutation({
    onSuccess: () => {
      utils.thread.list.invalidate();
      utils.thread.getById.invalidate({ id: selectedThreadId! });
    },
  });

  const handleSelectThread = useCallback(
    (id: string) => {
      setSelectedThreadId(id);
      setSendError(null);
      markReadMutation.mutate({ id });
    },
    [markReadMutation]
  );

  const handleSendMessage = useCallback(
    (text: string, type: "reply" | "internal") => {
      if (!selectedThreadId) return;
      setSendError(null);
      sendMessageMutation.mutate({
        threadId: selectedThreadId,
        type,
        text,
      });
    },
    [selectedThreadId, sendMessageMutation]
  );

  const handleUpdateStatus = useCallback(
    (status: string) => {
      if (!selectedThreadId) return;
      updateThreadMutation.mutate({ id: selectedThreadId, status });
    },
    [selectedThreadId, updateThreadMutation]
  );

  const handleAssign = useCallback(
    (userId: string | null) => {
      if (!selectedThreadId) return;
      updateThreadMutation.mutate({ id: selectedThreadId, assigneeId: userId });
    },
    [selectedThreadId, updateThreadMutation]
  );

  const threads = threadsQuery.data ?? [];

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      <ThreadList
        threads={threads}
        selectedThread={selectedThreadId}
        onSelectThread={handleSelectThread}
      />

      <ChatPanel
        thread={threadDetailQuery.data ?? null}
        messages={messagesQuery.data ?? []}
        showContext={showContext}
        onToggleContext={() => setShowContext(!showContext)}
        onSendMessage={handleSendMessage}
        sendError={sendError}
        isSending={sendMessageMutation.isPending}
      />

      {showContext && threadDetailQuery.data && (
        <ContextSidebar
          thread={threadDetailQuery.data}
          participants={participantsQuery.data ?? []}
          staffUsers={staffUsersQuery.data ?? []}
          onUpdateStatus={handleUpdateStatus}
          onAssign={handleAssign}
        />
      )}
    </div>
  );
}
