"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const CATEGORIES = ["BLANKS", "SUPPLIES", "LABOR", "SHIPPING", "OUTSOURCE", "OTHER"];

const usd = (n: number | string) =>
  Number(n).toLocaleString("en-US", { style: "currency", currency: "USD" });

export function OrderExpensesTab({ orderId }: { orderId: string }) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("BLANKS");
  const [amount, setAmount] = useState("");

  const utils = trpc.useUtils();
  const { data: expenses } = trpc.expense.list.useQuery({ orderId });
  const { data: profit } = trpc.expense.orderProfitability.useQuery({ orderId });

  const invalidate = () => {
    utils.expense.list.invalidate({ orderId });
    utils.expense.orderProfitability.invalidate({ orderId });
  };
  const create = trpc.expense.create.useMutation({
    onSuccess: () => {
      setDescription("");
      setAmount("");
      invalidate();
    },
  });
  const remove = trpc.expense.delete.useMutation({ onSuccess: invalidate });

  return (
    <div className="space-y-4">
      {/* Margin summary */}
      {profit && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-surface-border bg-surface-card px-5 py-4">
          <Stat label="Revenue" value={usd(profit.revenue)} />
          <Stat label="Costs" value={usd(profit.costs)} />
          <Stat
            label="Margin"
            value={`${usd(profit.margin)}${profit.marginPercent != null ? ` / ${profit.marginPercent.toFixed(0)}%` : ""}`}
            color={profit.margin >= 0 ? "text-green-400" : "text-red-400"}
          />
        </div>
      )}

      {/* Fast add row */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!description.trim() || !amount) return;
          create.mutate({
            orderId,
            description: description.trim(),
            category: category as any,
            amount: parseFloat(amount),
          });
        }}
        className="flex flex-wrap items-end gap-2 rounded-xl border border-surface-border bg-surface-card p-4"
      >
        <div className="min-w-40 flex-1">
          <label className="mb-0.5 block text-xs text-gray-500">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Gildan blanks from S&S"
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

      {/* Expense list */}
      {(expenses ?? []).length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          No expenses recorded for this order yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-surface-border">
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
              {(expenses ?? []).map((e: any) => (
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-base font-bold ${color ?? "text-white"}`}>{value}</p>
    </div>
  );
}
