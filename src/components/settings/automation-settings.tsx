"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ArrowDown, ArrowUp, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

const TRIGGER_LABEL: Record<string, string> = {
  STATUS_CHANGED: "Order status changes",
  QUOTE_APPROVED: "Quote approved",
  PROOF_APPROVED: "All proofs approved",
  PAID_IN_FULL: "Invoice paid in full",
  DEPOSIT_PAID: "Deposit paid",
};

const ACTION_LABEL: Record<string, string> = {
  SEND_CLIENT_EMAIL: "Email the client",
  CHANGE_STATUS: "Change order status",
  REQUEST_PAYMENT_PERCENT: "Request % payment",
  CREATE_TASKS: "Create tasks",
};

export function AutomationSettings() {
  const utils = trpc.useUtils();
  const { data: rules, isLoading } = trpc.automation.list.useQuery();
  const [editingId, setEditingId] = useState<string | null>(null);

  const invalidate = () => utils.automation.list.invalidate();
  const setEnabled = trpc.automation.setEnabled.useMutation({ onSuccess: invalidate });
  const move = trpc.automation.move.useMutation({ onSuccess: invalidate });
  const installDefaults = trpc.automation.installDefaults.useMutation({
    onSuccess: invalidate,
  });

  return (
    <div className="mb-6 rounded-lg border border-surface-border bg-surface-card p-5">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-label text-[11px] uppercase tracking-label text-ink-muted">
          <Zap className="h-3.5 w-3.5 text-coral" />
          Automations
        </h3>
        <button
          onClick={() => installDefaults.mutate()}
          disabled={installDefaults.isPending}
          className="rounded-md border border-surface-border px-2.5 py-1 text-xs font-medium text-foreground-secondary hover:text-foreground disabled:opacity-50"
        >
          {installDefaults.isPending ? "Installing..." : "Install defaults"}
        </button>
      </div>
      <p className="mb-4 text-xs text-foreground-muted">
        Rules run top to bottom when their trigger fires. A failing rule never
        blocks the underlying action.
      </p>

      {isLoading ? (
        <p className="py-6 text-center text-sm text-foreground-muted">Loading...</p>
      ) : (rules ?? []).length === 0 ? (
        <p className="py-6 text-center text-sm text-foreground-muted">
          No rules yet — click &quot;Install defaults&quot; to set up the
          standard shop automations.
        </p>
      ) : (
        <div className="space-y-2">
          {(rules ?? []).map((rule: any, i: number) => (
            <div
              key={rule.id}
              className={cn(
                "rounded-lg border px-4 py-3",
                rule.enabled
                  ? "border-surface-border bg-surface-secondary"
                  : "border-surface-border/50 bg-surface-secondary/40 opacity-60"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Toggle */}
                <button
                  onClick={() => setEnabled.mutate({ id: rule.id, enabled: !rule.enabled })}
                  className={cn(
                    "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                    rule.enabled ? "bg-coral" : "bg-gray-600"
                  )}
                  aria-label={rule.enabled ? "Disable rule" : "Enable rule"}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                      rule.enabled ? "translate-x-4" : "translate-x-0.5"
                    )}
                  />
                </button>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{rule.name}</p>
                  <p className="text-xs text-foreground-muted">
                    {TRIGGER_LABEL[rule.trigger] ?? rule.trigger}
                    {rule.triggerParam ? ` → ${rule.triggerParam}` : ""}
                    {" · "}
                    {ACTION_LABEL[rule.action] ?? rule.action}
                    {rule.action === "REQUEST_PAYMENT_PERCENT" && rule.actionParam?.percent
                      ? ` (${rule.actionParam.percent}%)`
                      : ""}
                  </p>
                  {rule.lastRun && (
                    <p className="mt-0.5 text-[11px] text-foreground-muted">
                      Last run{" "}
                      {formatDistanceToNow(new Date(rule.lastRun.createdAt), { addSuffix: true })}
                      {" — "}
                      <span className={rule.lastRun.success ? "text-green-400" : "text-red-400"}>
                        {rule.lastRun.success ? "ok" : "failed"}
                      </span>
                      {rule.lastRun.detail ? `: ${rule.lastRun.detail}` : ""}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {rule.action === "REQUEST_PAYMENT_PERCENT" && (
                    <button
                      onClick={() => setEditingId(editingId === rule.id ? null : rule.id)}
                      className="rounded-md border border-surface-border px-2 py-1 text-xs text-foreground-secondary hover:text-foreground"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => move.mutate({ id: rule.id, direction: "up" })}
                    disabled={i === 0}
                    className="rounded p-1 text-foreground-muted hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => move.mutate({ id: rule.id, direction: "down" })}
                    disabled={i === (rules ?? []).length - 1}
                    className="rounded p-1 text-foreground-muted hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {editingId === rule.id && (
                <PercentEditor
                  rule={rule}
                  onDone={() => {
                    setEditingId(null);
                    invalidate();
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PercentEditor({ rule, onDone }: { rule: any; onDone: () => void }) {
  const [percent, setPercent] = useState(String(rule.actionParam?.percent ?? 50));
  const update = trpc.automation.updateParams.useMutation({ onSuccess: onDone });

  return (
    <div className="mt-3 flex items-center gap-2 border-t border-surface-border pt-3">
      <label className="text-xs text-foreground-muted">Deposit percent</label>
      <input
        type="number"
        min="1"
        max="100"
        value={percent}
        onChange={(e) => setPercent(e.target.value)}
        className="w-16 rounded-md border border-surface-border bg-surface-card px-2 py-1 text-center text-sm text-foreground focus:border-coral focus:outline-none"
      />
      <button
        onClick={() =>
          update.mutate({
            id: rule.id,
            actionParam: { ...rule.actionParam, percent: parseInt(percent) || 50 },
          })
        }
        disabled={update.isPending}
        className="rounded-md bg-coral px-3 py-1 text-xs font-medium text-white hover:bg-coral-dark disabled:opacity-50"
      >
        Save
      </button>
    </div>
  );
}
