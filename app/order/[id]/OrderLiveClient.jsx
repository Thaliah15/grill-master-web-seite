"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button } from "/components/ui";
import { formatMoney } from "/lib/money";

const TERMINAL = new Set(["DELIVERED", "CANCELED"]);

const STATUS_META = {
  PENDING: { label: "Bestellung erhalten", cls: "bg-gray-100 text-gray-800 border-gray-200" },
  CONFIRMED: { label: "Bestätigt", cls: "bg-blue-50 text-blue-800 border-blue-200" },
  PREPARING: { label: "Wird zubereitet", cls: "bg-amber-50 text-amber-900 border-amber-200" },
  OUT_FOR_DELIVERY: { label: "Unterwegs", cls: "bg-indigo-50 text-indigo-900 border-indigo-200" },
  DELIVERED: { label: "Geliefert", cls: "bg-emerald-50 text-emerald-900 border-emerald-200" },
  CANCELED: { label: "Storniert", cls: "bg-rose-50 text-rose-900 border-rose-200" },
};

function progressColor(status) {
  if (status === "PREPARING") return "bg-amber-500";
  if (status === "OUT_FOR_DELIVERY") return "bg-indigo-500";
  if (status === "DELIVERED") return "bg-emerald-500";
  if (status === "CANCELED") return "bg-rose-500";
  if (status === "CONFIRMED") return "bg-blue-500";
  return "bg-gray-900";
}

export default function OrderLiveClient({ initialOrder, symbol }) {
  const [live, setLive] = useState(initialOrder);
  const sm = STATUS_META[live.status] || { label: live.status, cls: "bg-gray-100 text-gray-800 border-gray-200" };

  // ✅ إذا صار Delivered أو Canceled: احذف last_order_id
  useEffect(() => {
    if (TERMINAL.has(live.status)) {
      localStorage.removeItem("last_order_id");
    }
  }, [live.status]);

  // ✅ تحديث تلقائي
  useEffect(() => {
    let alive = true;
    const id = initialOrder.id;

    async function tick() {
      try {
        const res = await fetch(`/api/order/${id}`, { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!alive || !res.ok || !data) return;
        setLive((prev) => ({ ...prev, ...data }));
      } catch {}
    }

    tick();
    const t = setInterval(tick, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [initialOrder.id]);

  // ✅ إذا خلص الطلب: اعرض رسالة بدل “Status Box”
  if (TERMINAL.has(live.status)) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-soft text-right">
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${sm.cls}`}>
          {sm.label}
        </div>
        <div className="mt-2 text-sm text-gray-600">
        Diese Bestellung ist abgeschlossen. Wenn Sie erneut bestellen möchten, bitte zum Menü wechseln.        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button href="/menu">Menü öffnen</Button>
          <Button href="/" variant="secondary">Startseite</Button>
        </div>
      </div>
    );
  }

  // ✅ الحالة الملونة أثناء التحضير
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-soft min-w-[280px]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-gray-500">Status</div>
        <Badge className={`border ${sm.cls}`}>{sm.label}</Badge>
      </div>

      <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
        <div className={`h-2 rounded-full transition-all ${progressColor(live.status)}`} style={{ width: "100%" }} />
      </div>

      <div className="mt-3 text-sm text-gray-700">
        Gesamt: <span className="font-semibold">{formatMoney(live.totalCents, symbol)}</span>
      </div>
    </div>
  );
}
