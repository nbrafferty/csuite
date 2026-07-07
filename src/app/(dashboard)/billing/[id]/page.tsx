"use client";

import { useParams } from "next/navigation";
import { InvoiceDetail } from "./invoice-detail";

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <InvoiceDetail invoiceId={id} />;
}
