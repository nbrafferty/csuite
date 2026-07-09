"use client";

import { useState } from "react";
import { format, startOfYear } from "date-fns";
import { Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";

const CATEGORIES = ["BLANKS", "SUPPLIES", "LABOR", "SHIPPING", "OUTSOURCE", "OTHER"];

const usd = (n: number | string) =>
  Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function ExpensesPage() {
  const { data: session } = useSession();
  const isStaff = (session?.user as any)?.role === "CCC_STAFF";

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("SUPPLIES");
  const [amount, setAmount] = useState("");
  const [from] = useState(() => startOfYear(new Date()).toISOString());
  const [to] = useState(() => new Date().toISOString());

  const utils = trpc.useUtils();
  const { data: expenses } = trpc.expense.list.useQuery(
    { unattached: true },
    { enabled: isStaff }
  );
  const { data: profitRows } = trpc.expense.profitByClient.useQuery(
    { from, to },
    { enabled: isStaff }
  );
  const create = trpc.expense.create.useMutation({
    onSuccess: () => {
      setDescription("");
      setAmount("");
      utils.expense.list.invalidate();
    },
  });
  const remove = trpc.expense.delete.useMutation({
    onSuccess: () => utils.expense.list.invalidate(),
  });

  if (!isStaff) {
    return (
      <p className="py-20 text-center text-sm text-gray-500">
        Expenses are only available to staff.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl uppercase tracking-display text-white">
          Expenses
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Unattached shop costs, plus profitability by client. Order-specific
          expenses live on each order&apos;s Expenses tab.
        </p>
      </div>

      {/* Fast add for shop costs */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!description.trim() || !amount) return;
          create.mutate({
            description: description.trim(),
            category: category as any,
            amount: parseFloat(amount),
          });
        }}
        className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-surface-border bg-surface-card p-4"
      >
        <div className="min-w-40 flex-1">
          <label className="mb-0.5 block text-xs text-gray-500">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Squeegee restock"
            className="w-full rounded-md border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-xs text-gray-500">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-md border border-surface-border bg-surface-bg px-2 py-2 text-sm text-white focus:border-coral focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
        <div className="w-28">
          <label className="mb-0.5 block text-xs text-gray-500">Amount</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-md border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={create.isPending}
          className="rounded-md bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {/* Unattached expenses */}
      <div className="mb-8 overflow-hidden rounded-xl border border-surface-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface-card text-left text-xs uppercase tracking-wider text-gray-500">
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2 text-right">Amount</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {(expenses ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="bg-surface-card px-3 py-6 text-center text-gray-500">
                  No unattached shop expenses yet.
                </td>
              </tr>
            ) : (
              (expenses ?? []).map((e: any) => (
                <tr key={e.id} className="bg-surface-card">
                  <td className="px-3 py-2 text-gray-200">{e.description}</td>
                  <td className="px-3 py-2 text-xs text-gray-400">
                    {e.category.charAt(0) + e.category.slice(1).toLowerCase()}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-400">
                    {format(new Date(e.incurredAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-white">
                    {usd(e.amount)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => remove.mutate({ id: e.id })}
                      className="text-gray-600 transition-colors hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Profit by client (YTD) */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Profit by client — year to date
      </h2>
      <div className="overflow-hidden rounded-xl border border-surface-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-surface-card text-left text-xs uppercase tracking-wider text-gray-500">
              <th className="px-3 py-2">Client</th>
              <th className="px-3 py-2 text-right">Revenue</th>
              <th className="px-3 py-2 text-right">Costs</th>
              <th className="px-3 py-2 text-right">Margin</th>
              <th className="px-3 py-2 text-right">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {(profitRows ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="bg-surface-card px-3 py-6 text-center text-gray-500">
                  No revenue or costs recorded this year.
                </td>
              </tr>
            ) : (
              (profitRows ?? []).map((r: any) => (
                <tr key={r.companyId} className="bg-surface-card">
                  <td className="px-3 py-2 text-gray-200">{r.companyName}</td>
                  <td className="px-3 py-2 text-right text-gray-300">{usd(r.revenue)}</td>
                  <td className="px-3 py-2 text-right text-gray-300">{usd(r.costs)}</td>
                  <td className={`px-3 py-2 text-right font-medium ${r.margin >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {usd(r.margin)}
                  </td>
                  <td className="px-3 py-2 text-right text-xs text-gray-400">
                    {r.marginPercent != null ? `${r.marginPercent.toFixed(0)}%` : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
