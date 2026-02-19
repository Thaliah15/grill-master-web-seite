"use client";

import { useEffect, useMemo, useState } from "react";
import { loadCart, clearCart } from "/lib/cartStorage";
import Link from "next/link";
import { Button, Input, Textarea, Badge } from "/components/ui";
import { formatMoney } from "/lib/money";

export default function CheckoutPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState("COD"); // Cash by default
  const [fulfillment, setFulfillment] = useState("DELIVERY");
  const [form, setForm] = useState({ customerName: "", phone: "", address: "", notes: "" });
  const [error, setError] = useState("");
  const [settings, setSettings] = useState(null);

  useEffect(() => setItems(loadCart()), []);
  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(setSettings).catch(()=>{});
  }, []);

  const symbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "€";

  const subtotalCents = useMemo(() => items.reduce((s, it) => s + it.unitPriceCents * it.quantity, 0), [items]);
  const deliveryFeeCents = useMemo(() => {
    if (!settings) return 0;
    return fulfillment === "DELIVERY" ? (settings.deliveryFeeCents || 0) : 0;
  }, [settings, fulfillment]);
  const totalCents = subtotalCents + deliveryFeeCents;

  async function submit() {
    setError("");
    if (items.length === 0) return setError("Der Warenkorb ist leer.");
    if (!form.customerName || !form.phone) return setError("Bitte Name und Telefon ausfüllen.");
    if (fulfillment === "DELIVERY" && (!form.address || form.address.length < 5)) return setError("Bitte Adresse für Lieferung eingeben.");

    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
          customerName: form.customerName,
          phone: form.phone,
          address: form.address,
          notes: form.notes,
          paymentMethod: method,
          fulfillmentMethod: fulfillment,
        }),
      });
      const data = await res.json();
      if (data?.orderId){
         localStorage.setItem("last_order_id", data.orderId);
         window.dispatchEvent(new Event("last_order_changed"));
        window.location.href = `/success?orderId=${data.orderId}`;
        clearCart();
        return;
      }
      if (!res.ok) throw new Error(data?.error || "Bestellung konnte nicht erstellt werden.");
      if (data.orderId) {
        window.location.href = `/success?orderId=${data.orderId}`;
        clearCart();
        return;
      }
      if (data.redirectUrl) {
        localStorage.setItem("last_order_id", data.orderId);
        window.dispatchEvent(new Event("last_order_changed"));
        window.location.href = data.redirectUrl;
        clearCart();
        return;
      }
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }

  const minOk = settings ? subtotalCents >= (settings.minOrderCents || 0) : true;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Kasse</h1>

      {settings && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Öffnungszeiten: {settings.openTime} – {settings.closeTime}</Badge>
            <Badge>Mindestbestellwert: {formatMoney(settings.minOrderCents, symbol)}</Badge>
            {fulfillment === "DELIVERY" ? <Badge>Liefergebühr: {formatMoney(settings.deliveryFeeCents, symbol)}</Badge> : null}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
          Der Warenkorb ist leer. <Link className="underline" href="/menu">Zur Speisekarte</Link>
        </div>
      )}

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-soft space-y-3">
            <div className="font-bold">Bestellart</div>
            <div className="flex flex-wrap gap-2">
              <button
                className={"rounded-full px-3 py-2 text-sm font-semibold " + (fulfillment==="DELIVERY" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}
                onClick={() => setFulfillment("DELIVERY")}
                disabled={settings && !settings.enableDelivery}
              >
                Lieferung
              </button>
              <button
                className={"rounded-full px-3 py-2 text-sm font-semibold " + (fulfillment==="PICKUP" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}
                onClick={() => setFulfillment("PICKUP")}
                disabled={settings && !settings.enablePickup}
              >
                Abholung
              </button>
            </div>
            {settings && ((fulfillment==="DELIVERY" && !settings.enableDelivery) || (fulfillment==="PICKUP" && !settings.enablePickup)) ? (
              <div className="text-sm text-rose-700">Diese Bestellart ist aktuell nicht verfügbar.</div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-soft space-y-3">
            <div className="font-bold">Kontakt</div>
            <Input placeholder="Name" value={form.customerName} onChange={(e)=>setForm({...form, customerName:e.target.value})} />
            <Input placeholder="Telefon" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} />
            {fulfillment === "DELIVERY" ? (
              <Input placeholder=" Adresse (bitte die komplete Adresse geben)" value={form.address} onChange={(e)=>setForm({...form, address:e.target.value})} />
            ) : (
              <div className="text-sm text-gray-600">Abholung: keine Adresse nötig.</div>
            )}
            <Textarea rows={3} placeholder="Notizen (optional)" value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} />
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-soft space-y-3">
            <div className="font-bold">Zahlung</div>
            <div className="flex flex-wrap gap-2">
              <button
                className={"rounded-full px-3 py-2 text-sm font-semibold " + (method==="COD" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}
                onClick={() => setMethod("COD")}
              >
                Bar bei {fulfillment==="PICKUP" ? "Abholung" : "Lieferung"}
              </button>
              <button
                className={"rounded-full px-3 py-2 text-sm font-semibold " + (method==="ONLINE" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200")}
                onClick={() => setMethod("ONLINE")}
                title="Wird später aktiviert"
              >
                Online (später)
              </button>
            </div>
            {method === "ONLINE" ? <div className="text-xs text-gray-500">Online-Zahlung wird vorbereitet (Stripe).</div> : null}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-soft space-y-3">
            <div className="font-bold">Zusammenfassung</div>
            <div className="space-y-2 text-sm">
              {items.map((it) => (
                <div key={it.productId} className="flex items-center justify-between gap-3">
                  <div className="text-gray-700">{it.quantity}× {it.name}</div>
                  <div className="font-semibold">{formatMoney(it.unitPriceCents * it.quantity, symbol)}</div>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-2 flex justify-between">
                <div className="text-gray-600">Zwischensumme</div>
                <div className="font-semibold">{formatMoney(subtotalCents, symbol)}</div>
              </div>
              <div className="flex justify-between">
                <div className="text-gray-600">Liefergebühr</div>
                <div className="font-semibold">{formatMoney(deliveryFeeCents, symbol)}</div>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between text-base">
                <div className="font-bold">Gesamt</div>
                <div className="font-bold">{formatMoney(totalCents, symbol)}</div>
              </div>
              {settings && !minOk ? (
                <div className="text-sm text-rose-700">
                  Mindestbestellwert: {formatMoney(settings.minOrderCents, symbol)}
                </div>
              ) : null}
            </div>

            <Button onClick={submit} disabled={loading || items.length===0 || (settings && !minOk)}>
              {loading ? "Sende..." : "Bestellung aufgeben"}
            </Button>
            <Link href="/menu" className="text-sm text-gray-600 underline">Zurück zur Speisekarte</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
