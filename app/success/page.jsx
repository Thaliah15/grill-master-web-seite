"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

export default function SuccessPage() {
  return (
    <Suspense fallback={<div />}>
      <SuccessInner />
    </Suspense>
  );
}

function SuccessInner() {
  const sp = useSearchParams();
  const router = useRouter();

  const orderId = useMemo(() => sp.get("orderId") || "", [sp]);

  useEffect(() => {
    if (!orderId) return;
    // خزّن آخر طلب عشان زر "Bestellung ansehen"
    localStorage.setItem("last_order_id", orderId);
  }, [orderId]);

  if (!orderId) {
    return (
      <div className="mx-auto max-w-xl space-y-3 rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
        <h1 className="text-2xl font-extrabold">Erfolg</h1>
        <p className="text-sm text-gray-600">Keine Bestellnummer gefunden.</p>
        <Link className="underline font-semibold" href="/menu">
          Zur Speisekarte
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
      <h1 className="text-2xl font-extrabold">✅ Bestellung erfolgreich</h1>
      <p className="text-sm text-gray-700">
        Deine Bestellnummer:{" "}
        <span className="font-bold">{orderId.slice(-6)}</span>
      </p>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/order/${orderId}`}
          className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Bestellung ansehen
        </Link>

        <button
          onClick={() => router.push("/menu")}
          className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          Weiter bestellen
        </button>
      </div>
    </div>
  );
}