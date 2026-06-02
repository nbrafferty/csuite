"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProofStudio from "@/components/proofs/proof-studio";

export default function ProofDemoPage() {
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
        <span className="text-sm font-medium text-white">
          Acme Corp Polo — Spring 2025
        </span>
        <span className="ml-2 rounded bg-blue-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400">
          Demo
        </span>
      </div>
      <ProofStudio />
    </div>
  );
}
