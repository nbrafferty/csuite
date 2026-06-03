"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useSession } from "next-auth/react";
import { Plus, FileCheck, Clock, AlertTriangle, CheckCircle, Play } from "lucide-react";
import { CreateProofDialog } from "@/components/proofs/create-proof-dialog";

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
  const router = useRouter();
  const isStaff = (session?.user as any)?.role === "CCC_STAFF";
  const companyId = (session?.user as any)?.companyId ?? "";
  const { data: proofs, isLoading } = trpc.proof.list.useQuery({});
  const [showCreate, setShowCreate] = useState(false);

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
        {isStaff && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-md bg-coral px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-coral-light"
          >
            <Plus className="h-4 w-4" />
            New proof
          </button>
        )}
      </div>

      <CreateProofDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(proofId) => {
          setShowCreate(false);
          router.push(`/proofs/${proofId}`);
        }}
        companyId={companyId}
        isStaff={isStaff}
      />

      {/* Example proof — interactive demo with seeded data */}
      <div className="mt-6">
        <Link
          href="/proofs/demo"
          className="group flex items-center justify-between rounded-md border border-dashed border-coral/30 bg-coral/5 px-5 py-4 transition-colors hover:border-coral/50 hover:bg-coral/10"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-white group-hover:text-coral-light">
                Acme Corp Polo — Spring 2025
              </p>
              <span className="rounded bg-coral/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-coral">
                Example
              </span>
            </div>
            <p className="mt-0.5 text-xs text-ink-faint">
              2 versions · Interactive demo with annotations, comments, and approval flow
            </p>
          </div>
          <div className="ml-4 flex items-center gap-2">
            <Play className="h-4 w-4 text-coral" />
            <span className="text-xs font-medium text-coral">
              Try it
            </span>
          </div>
        </Link>
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
