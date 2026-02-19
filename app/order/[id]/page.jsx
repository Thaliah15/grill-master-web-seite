import { prisma } from "/lib/prisma";
import { formatMoney } from "/lib/money";
import OrderLiveClient from "./OrderLiveClient";

export const dynamic = "force-dynamic";

function labelPayStatus(s) {
  const map = {
    UNPAID: "Unbezahlt",
    PAID: "Bezahlt",
    FAILED: "Fehlgeschlagen",
    REFUNDED: "Erstattet",
  };
  return map[s] || s;
}

export default async function OrderPage({ params }) {
  const { id } =  await params; // ✅ بدون await

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        Bestellung nicht gefunden.
      </div>
    );
  }

  const symbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "€";

  // ✅ safe serialize (عشان Date وغيره)
  const safeOrder =
    typeof structuredClone === "function"
      ? structuredClone(order)
      : JSON.parse(JSON.stringify(order));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">
            Bestellung #{order.id.slice(-6)}
          </h1>
          <p className="text-sm text-gray-600">
            Diese Seite aktualisiert sich automatisch.
          </p>
        </div>

        {/* ✅ Status + Auto refresh client */}
        <OrderLiveClient initialOrder={safeOrder} symbol={symbol} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-soft">
          <div className="text-sm text-gray-600">Zahlung</div>
          <div className="mt-1 font-bold">
            {order.paymentMethod} · {labelPayStatus(order.paymentStatus)}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-soft">
          <div className="text-sm text-gray-600">Gesamt</div>
          <div className="mt-1 font-bold">
            {formatMoney(order.totalCents, symbol)}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-soft">
          <div className="text-sm text-gray-600">Kontakt</div>
          <div className="mt-1 font-bold">{order.customerName}</div>
          <div className="text-sm text-gray-600">{order.phone}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-200 shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold">Artikel</th>
              <th className="px-4 py-3 font-semibold">Menge</th>
              <th className="px-4 py-3 font-semibold">Summe</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id} className="border-t border-gray-100">
                <td className="px-4 py-3">{it.nameSnapshot}</td>
                <td className="px-4 py-3">{it.quantity}</td>
                <td className="px-4 py-3 font-semibold">
                  {formatMoney(it.lineTotalCents, symbol)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-soft">
        <div className="text-sm text-gray-600">Adresse</div>
        <div className="mt-1 font-semibold">{order.address}</div>
        {order.notes ? (
          <div className="mt-2 text-sm text-gray-600">Notiz: {order.notes}</div>
        ) : null}
      </div>
    </div>
  );
}
