"use client";

import { useState } from "react";
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

let stripePromise: Promise<StripeJs | null> | null = null;
function getStripePromise() {
  if (!stripePromise && publishableKey) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

export function isStripeEnabled() {
  return Boolean(publishableKey);
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);

// CCC dark theme for Stripe Elements
const appearance = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#da5245",
    colorBackground: "#1A1A1E",
    colorText: "#f0ece6",
    colorDanger: "#da5245",
    fontFamily: "Barlow, Helvetica Neue, Arial, sans-serif",
    borderRadius: "8px",
  },
};

type StripePaymentSectionProps = {
  invoiceId: string;
  outstanding: number;
};

/**
 * Client-facing "Pay Online" section for an open invoice. Creates a Stripe
 * PaymentIntent on demand and renders the embedded payment form.
 */
export function StripePaymentSection({
  invoiceId,
  outstanding,
}: StripePaymentSectionProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState(outstanding);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createIntent = trpc.invoice.createPaymentIntent.useMutation({
    onSuccess: (data) => {
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setAmount(data.amount);
        setError(null);
      }
    },
    onError: (err) => setError(err.message),
  });

  if (!isStripeEnabled()) return null;

  if (paid) {
    return (
      <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 px-5 py-4">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
        <div>
          <p className="text-sm font-medium text-green-400">
            Payment submitted
          </p>
          <p className="text-xs text-gray-500">
            Your payment of {formatCurrency(amount)} is processing. This
            invoice will update shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-lg border border-surface-border bg-surface-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">Pay Online</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Pay the outstanding balance of {formatCurrency(outstanding)} by
            card or bank
          </p>
        </div>
        {!clientSecret && (
          <button
            onClick={() => createIntent.mutate({ invoiceId })}
            disabled={createIntent.isPending}
            className="flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-coral-dark disabled:opacity-50"
          >
            {createIntent.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            {createIntent.isPending ? "Starting..." : "Pay Now"}
          </button>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral-light">
          {error}
        </p>
      )}

      {clientSecret && (
        <div className="mt-4">
          <Elements
            stripe={getStripePromise()}
            options={{ clientSecret, appearance }}
          >
            <CheckoutForm
              amount={amount}
              onPaid={() => setPaid(true)}
              onCancel={() => setClientSecret(null)}
            />
          </Elements>
        </div>
      )}
    </div>
  );
}

function CheckoutForm({
  amount,
  onPaid,
  onCancel,
}: {
  amount: number;
  onPaid: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    onPaid();
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />

      {error && (
        <p className="mt-3 rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-xs text-coral-light">
          {error}
        </p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-surface-border px-4 py-2 text-sm text-gray-400 hover:text-white"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || submitting}
          className="flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-coral-dark disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Processing..." : `Pay ${formatCurrency(amount)}`}
        </button>
      </div>
    </form>
  );
}
