"use client";

import { useParams } from "next/navigation";
import { OrderDetail } from "./order-detail";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  return <OrderDetail orderId={id} />;
}
