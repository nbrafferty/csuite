"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Plus, MapPin, Truck, ExternalLink } from "lucide-react";

const SHIPMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-500/10 text-gray-400",
  LABEL_CREATED: "bg-blue-500/10 text-blue-400",
  IN_TRANSIT: "bg-amber-500/10 text-amber-400",
  DELIVERED: "bg-emerald-500/10 text-emerald-400",
};

const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  LABEL_CREATED: "Label Created",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
};

export function OrderShippingTab({ order, isStaff }: { order: any; isStaff: boolean }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const shipments = order.shipments ?? [];

  return (
    <div className="space-y-4">
      {isStaff && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Shipment
          </button>
        </div>
      )}

      {showAddForm && isStaff && (
        <AddShipmentForm
          orderId={order.id}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {shipments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-surface-border bg-surface-card py-16 text-center">
          <Truck className="h-10 w-10 text-gray-600" />
          <p className="mt-3 text-gray-400">No shipments yet</p>
          <p className="mt-1 text-xs text-gray-600">
            Shipments will appear here once the order is ready.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {shipments.map((shipment: any, idx: number) => {
            const address = shipment.destinationAddress as any;
            const loc = shipment.location;

            return (
              <div
                key={shipment.id}
                className="rounded-xl border border-surface-border bg-surface-card p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                      <MapPin className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">
                        Shipment {idx + 1}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {address
                          ? `${address.name}, ${address.street}, ${address.city}, ${address.state} ${address.zip}`
                          : loc
                          ? `${loc.label} — ${loc.addressLine1}, ${loc.city}, ${loc.state} ${loc.zip}`
                          : "Address pending"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                      SHIPMENT_STATUS_COLORS[shipment.status] ?? "bg-gray-500/10 text-gray-400"
                    )}
                  >
                    {SHIPMENT_STATUS_LABELS[shipment.status] ?? shipment.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div>
                    <span className="text-xs text-gray-500">Carrier</span>
                    <p className="text-sm text-gray-300">
                      {shipment.carrier || "--"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Tracking #</span>
                    <p className="text-sm text-gray-300">
                      {shipment.trackingNumber ? (
                        shipment.trackingUrl ? (
                          <a
                            href={shipment.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-coral hover:text-coral-light"
                          >
                            {shipment.trackingNumber}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          shipment.trackingNumber
                        )
                      ) : (
                        "--"
                      )}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Shipped</span>
                    <p className="text-sm text-gray-300">
                      {shipment.shippedAt
                        ? new Date(shipment.shippedAt).toLocaleDateString()
                        : "--"}
                    </p>
                  </div>
                </div>

                {shipment.lineItems?.length > 0 && (
                  <div className="mt-4 border-t border-surface-border pt-4">
                    <span className="text-xs text-gray-500">Items in Shipment</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {shipment.lineItems.map((li: any) => (
                        <span
                          key={li.id}
                          className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-gray-300"
                        >
                          {li.orderItem?.title ?? "Item"} ×{li.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddShipmentForm({
  orderId,
  onClose,
}: {
  orderId: string;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const utils = trpc.useUtils();
  const addMutation = trpc.order.addShipment.useMutation({
    onSuccess: () => {
      utils.order.get.invalidate({ id: orderId });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({
      orderId,
      destinationAddress: { name, street, city, state, zip, country: "US" },
      carrier: carrier || undefined,
      trackingNumber: trackingNumber || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-surface-border bg-surface-card p-6"
    >
      <h3 className="mb-4 text-sm font-semibold text-white">
        Add Shipment Destination
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Recipient Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">Street Address</label>
          <input
            required
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">City</label>
          <input
            required
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">State</label>
            <input
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">ZIP</label>
            <input
              required
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Carrier</label>
          <input
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="e.g. UPS, FedEx"
            className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-coral focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tracking #</label>
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="w-full rounded-lg border border-surface-border bg-surface-bg px-3 py-2 text-sm text-white focus:border-coral focus:outline-none"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-surface-border px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={addMutation.isPending}
          className="rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark transition-colors disabled:opacity-50"
        >
          {addMutation.isPending ? "Adding..." : "Add Shipment"}
        </button>
      </div>
    </form>
  );
}
