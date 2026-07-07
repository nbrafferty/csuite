"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Stamp,
  Clock,
  FileCheck,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { CreateProofDialog } from "@/components/proofs/create-proof-dialog";

interface OrderProofsTabProps {
  orderId: string;
  companyId: string;
  isStaff: boolean;
}

const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Awaiting review",
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

export function OrderProofsTab({ orderId, companyId, isStaff }: OrderProofsTabProps) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const { data: proofs, isLoading } = trpc.proof.list.useQuery({ orderId });

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-400">
          Proofs ({proofs?.length ?? 0})
        </h3>
        {isStaff && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-lg bg-coral px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-coral-dark"
          >
            <Plus className="h-3.5 w-3.5" />
            Upload Proof
          </button>
        )}
      </div>

      {/* Proof list */}
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-lg border border-surface-border bg-surface-card"
            />
          ))}
        </div>
      ) : !proofs || proofs.length === 0 ? (
        <div className="rounded-xl border border-surface-border bg-surface-card p-8 text-center">
          <Stamp className="mx-auto mb-3 h-8 w-8 text-gray-600" />
          <p className="text-sm text-gray-500">No proofs for this order</p>
          {isStaff && (
            <p className="mt-1 text-xs text-gray-600">
              Upload a proof to start the client review process
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {proofs.map((proof: any) => {
            const version = proof.currentVersion;
            const status = version?.status ?? "DRAFT";
            const StatusIcon = statusIcon[status] ?? Clock;

            return (
              <Link
                key={proof.id}
                href={`/proofs/${proof.id}`}
                className="group flex items-center justify-between rounded-lg border border-surface-border bg-surface-card px-4 py-3 transition-colors hover:border-coral/30"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-bg">
                    <Stamp className="h-5 w-5 text-ink-faint" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white group-hover:text-coral-light">
                      {proof.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      v{version?.versionNumber ?? 1}
                      {" · "}
                      {proof._count?.versions ?? 1} version
                      {(proof._count?.versions ?? 1) !== 1 ? "s" : ""}
                      {version?.publishedAt &&
                        ` · Published ${new Date(version.publishedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>

                <div className="ml-4 flex shrink-0 items-center gap-2">
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

      {/* Create dialog — opens ProofStudio on the new proof when done */}
      <CreateProofDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(proofId) => {
          setShowCreate(false);
          utils.proof.list.invalidate({ orderId });
          router.push(`/proofs/${proofId}`);
        }}
        companyId={companyId}
        isStaff={isStaff}
        orderId={orderId}
      />
    </div>
  );
}
