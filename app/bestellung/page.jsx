"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export default function BestellungPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    const id = localStorage.getItem("last_order_id") || "";
    setOrderId(id);

    if (id) {
      router.replace(`/order/${id}`);
      return;
    }
    setChecking(false);
  }, [router]);

  if (checking) {
    return <div className="p-6 text-sm text-gray-600">Lade…</div>;
  }

  // ✅ ما في طلب
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Bestellung ansehen</h1>

      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-soft">
        <div className="font-semibold">Keine aktuellen Bestellungen</div>
        <div className="mt-1 text-sm text-gray-600">
          Du hast gerade keine offene Bestellung.
        </div>

        <div className="mt-4 flex gap-2">
          <Button href="/menu">Menü öffnen</Button>
          <Button href="/cart" variant="secondary">Zum Warenkorb</Button>
        </div>
      </div>
    </div>
  );
}
