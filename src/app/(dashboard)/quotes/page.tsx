"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { QuotesList } from "@/components/quotes/quotes-list";
import { QuoteRequestsList } from "@/components/quotes/quote-requests-list";

type Tab = "quotes" | "requests";

export default function QuotesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("quotes");
  const { data: session } = useSession();
  const isStaff = (session?.user as any)?.role === "CCC_STAFF";

  const { data: requestsData } = trpc.quoteRequest.list.useQuery(
    { limit: 50 },
    { refetchInterval: 30_000, retry: false }
  );
  const requestCount = requestsData?.requests?.length ?? null;

  return (
    <div>
      {/* Tabs */}
      <div className="mb-6 flex items-center gap-1 border-b border-[#333338]">
        <button
          onClick={() => setActiveTab("quotes")}
          className={cn(
            "relative px-4 py-3 text-sm font-medium transition-colors",
            activeTab === "quotes"
              ? "text-white"
              : "text-gray-500 hover:text-gray-300"
          )}
        >
          Quotes
          {activeTab === "quotes" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-coral" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={cn(
            "relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
            activeTab === "requests"
              ? "text-white"
              : "text-gray-500 hover:text-gray-300"
          )}
        >
          Requests
          {requestCount !== null && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                activeTab === "requests"
                  ? "bg-coral/20 text-coral"
                  : "bg-[#22222A] text-gray-500"
              )}
            >
              {requestCount}
            </span>
          )}
          {activeTab === "requests" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-coral" />
          )}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === "quotes" && <QuotesList />}
      {activeTab === "requests" && <QuoteRequestsList />}
    </div>
  );
}
