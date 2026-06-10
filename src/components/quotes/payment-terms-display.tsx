"use client";

type PaymentTermsProps = {
  paymentTermType: string;
  depositPercent?: number | null;
  netDays?: number | null;
};

export function PaymentTermsDisplay({
  paymentTermType,
  depositPercent,
  netDays,
}: PaymentTermsProps) {
  switch (paymentTermType) {
    case "DEPOSIT":
      return (
        <span className="text-sm text-gray-400">
          {depositPercent ?? 50}% deposit, remainder on completion
        </span>
      );
    case "NET":
      return (
        <span className="text-sm text-gray-400">
          Net {netDays ?? 30} days from invoice
        </span>
      );
    case "FULL":
    default:
      return (
        <span className="text-sm text-gray-400">
          Pay in full before production
        </span>
      );
  }
}

export function PaymentTermsSummaryCard({
  paymentTermType,
  depositPercent,
  netDays,
  total,
}: PaymentTermsProps & { total: number }) {
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);

  return (
    <div className="rounded-lg border border-surface-border bg-surface-card p-4">
      <h4 className="mb-2 text-sm font-medium text-white">Payment Terms</h4>
      {paymentTermType === "FULL" && (
        <div className="space-y-1">
          <p className="text-sm text-gray-400">Pay in full before production</p>
          <p className="text-lg font-semibold text-white">
            {formatCurrency(total)}
          </p>
        </div>
      )}
      {paymentTermType === "DEPOSIT" && (
        <div className="space-y-1">
          <p className="text-sm text-gray-400">
            {depositPercent ?? 50}% deposit required
          </p>
          <p className="text-lg font-semibold text-white">
            {formatCurrency(total * ((depositPercent ?? 50) / 100))} due now
          </p>
          <p className="text-sm text-gray-500">
            {formatCurrency(total * (1 - (depositPercent ?? 50) / 100))}{" "}
            remainder on completion
          </p>
        </div>
      )}
      {paymentTermType === "NET" && (
        <div className="space-y-1">
          <p className="text-sm text-gray-400">
            Net {netDays ?? 30} days from invoice
          </p>
          <p className="text-lg font-semibold text-white">
            {formatCurrency(total)}
          </p>
        </div>
      )}
    </div>
  );
}
