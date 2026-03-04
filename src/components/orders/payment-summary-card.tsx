"use client";

import { cn } from "@/lib/utils";

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);

type PaymentSummaryCardProps = {
  paymentTermType: string;
  depositPercent?: number | null;
  netDays?: number | null;
  totalAmount: number;
  totalInvoiced: number;
  totalPaid: number;
};

export function PaymentSummaryCard({
  paymentTermType,
  depositPercent,
  netDays,
  totalAmount,
  totalInvoiced,
  totalPaid,
}: PaymentSummaryCardProps) {
  const outstanding = totalInvoiced - totalPaid;

  return (
    <div className="rounded-xl border border-[#333338] bg-[#1A1A1E] p-5">
      <h3 className="mb-3 text-sm font-semibold text-white">Payment Summary</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Terms</span>
          <span className="text-gray-300">
            {paymentTermType === "FULL"
              ? "Pay in Full"
              : paymentTermType === "DEPOSIT"
              ? `${depositPercent ?? 50}% Deposit`
              : `Net ${netDays ?? 30} Days`}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Order Total</span>
          <span className="font-medium text-white">{formatCurrency(totalAmount)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Total Invoiced</span>
          <span className="text-gray-300">{formatCurrency(totalInvoiced)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Total Paid</span>
          <span className="text-green-400">{formatCurrency(totalPaid)}</span>
        </div>

        <div className="border-t border-[#333338] pt-2">
          <div className="flex justify-between">
            <span className="text-gray-500">Outstanding</span>
            <span
              className={cn(
                "font-medium",
                outstanding > 0 ? "text-yellow-400" : "text-green-400"
              )}
            >
              {formatCurrency(outstanding)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
