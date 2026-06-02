"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import ProofStudio from "@/components/proofs/proof-studio";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ProofDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: proof, isLoading, error } = trpc.proof.byId.useQuery(
    { proofId: id },
    { enabled: !!id }
  );

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-coral border-t-transparent" />
      </div>
    );
  }

  if (error || !proof) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-sm text-ink-muted">
          {error?.message ?? "Proof not found"}
        </p>
        <Link
          href="/proofs"
          className="text-sm text-coral hover:text-coral-light"
        >
          Back to proofs
        </Link>
      </div>
    );
  }

  return (
    <div className="-mx-6 -mt-6">
      <div className="flex items-center gap-3 border-b border-surface-border px-6 py-3">
        <Link
          href="/proofs"
          className="flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Proofs
        </Link>
        <span className="text-ink-faint">/</span>
        <span className="text-sm font-medium text-white">{proof.title}</span>
      </div>
      <ProofStudio />
    </div>
  );
}
