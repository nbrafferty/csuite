"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { Plus, FileCheck, Clock, AlertTriangle, CheckCircle } from "lucide-react";

const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  CHANGES_REQUESTED: "Changes requested",
  APPROVED: "Approved",
  SUPERSEDED: "Superseded",
};

const statusColor: Record<string, string> = {
  DRAFT: "text-ink-faint",
  SENT: "text-blue-400",
  CHANGES_REQUESTED: "text-amber-400",
  APPROVED: "text-emerald-400",
  SUPERSEDED: "text-ink-faint",
};

const statusIcon: Record<string, typeof Clock> = {
  DRAFT: Clock,
  SENT: FileCheck,
  CHANGES_REQUESTED: AlertTriangle,
  APPROVED: CheckCircle,
  SUPERSEDED: Clock,
};

export default function ProofsPage() {
  const { data: session } = useSession();
  const isStaff = (session?.user as any)?.role === "CCC_STAFF";
  const { data: proofs, isLoading } = trpc.proof.list.useQuery({});

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-display text-white">
            Proofs
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Review and approve artwork proofs
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-8 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse-skeleton rounded-md bg-surface-card"
            />
          ))}
        </div>
      ) : !proofs?.length ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <FileCheck className="h-12 w-12 text-ink-faint" />
          <p className="mt-4 text-sm text-ink-muted">No proofs yet</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {proofs.map((proof: any) => {
            const version = proof.currentVersion;
            const status = version?.status ?? "DRAFT";
            const StatusIcon = statusIcon[status] ?? Clock;

            return (
              <Link
                key={proof.id}
                href={`/proofs/${proof.id}`}
                className="group flex items-center justify-between rounded-md border border-surface-border bg-surface-card px-5 py-4 transition-colors hover:border-coral/30 hover:bg-surface-card/80"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white group-hover:text-coral-light">
                    {proof.title}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {proof._count.versions} version{proof._count.versions !== 1 ? "s" : ""}
                    {version?.publishedAt &&
                      ` · Published ${new Date(version.publishedAt).toLocaleDateString()}`}
                  </p>
                </div>

                <div className="ml-4 flex items-center gap-2">
                  <StatusIcon className={`h-4 w-4 ${statusColor[status]}`} />
                  <span className={`text-xs font-medium ${statusColor[status]}`}>
                    {statusLabel[status]}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
