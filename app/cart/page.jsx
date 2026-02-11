"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadCart, updateQty, clearCart } from "@/lib/cartStorage";
import { calcTotals, formatMoney } from "@/lib/money";
import { Button, Input } from "@/components/ui";

export default function CartPage() {
  const [items, setItems] = useState([]);
  const symbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "€";
  const taxRate = Number(process.env.NEXT_PUBLIC_TAX_RATE || "0");

  useEffect(() => {
    // ✅ دايمًا Array
    setItems(loadCart());
  }, []);

  const totals = useMemo(() => calcTotals(items, taxRate), [items, taxRate]);

  function onQtyChange(productId, value) {
    const n = Number(value);
    const safe = Number.isFinite(n) ? n : 0;
    setItems(updateQty(productId, safe));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Warenkorb</h1>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-gray-700">
          Dein Warenkorb ist leer.{" "}
          <Link href="/menu" className="font-semibold underline">
            Zum Menü
          </Link>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-3xl border border-gray-200 shadow-soft">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold">Artikel</th>
                  <th className="px-4 py-3 font-semibold">Preis</th>
                  <th className="px-4 py-3 font-semibold">Menge</th>
                  <th className="px-4 py-3 font-semibold">Summe</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.productId} className="border-t border-gray-100">
                    <td className="px-4 py-3">{it.name}</td>
                    <td className="px-4 py-3">{formatMoney(it.unitPriceCents, symbol)}</td>
                    <td className="px-4 py-3 w-44">
                      <Input
                        type="number"
                        min={0}
                        value={it.quantity ?? 0}
                        onChange={(e) => onQtyChange(it.productId, e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {formatMoney((it.unitPriceCents + (it.extraPriceCents || 0)) * (it.quantity || 0), symbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-soft space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Zwischensumme</span>
              <strong>{formatMoney(totals.subtotalCents, symbol)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">MwSt.</span>
              <strong>{formatMoney(totals.taxCents, symbol)}</strong>
            </div>
            <div className="flex items-center justify-between text-lg">
              <span className="text-gray-900 font-semibold">Gesamt</span>
              <strong>{formatMoney(totals.totalCents, symbol)}</strong>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <Button
              variant="danger"
              onClick={() => {
                clearCart();
                setItems([]);
              }}
            >
              Warenkorb leeren
            </Button>
            <Button href="/checkout">Zur Kasse</Button>
          </div>
        </>
      )}
    </div>
  );
}
