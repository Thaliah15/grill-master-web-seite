"use client";

import { useMemo, useState } from "react";
import { useToast } from "/components/ToastProvider";
import Link from "next/link";
import { addToCart } from "/lib/cartStorage";
import { formatMoney } from "/lib/money";
import { Button, Badge } from "/components/ui";

function buildGroups(product) {
  return (product.optionGroups || [])
    .map((x) => x.group)
    .filter(Boolean)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function calcExtraCents(groups, selection) {
  let extra = 0;
  for (const g of groups) {
    const ids = selection[g.id] || [];
    for (const id of ids) {
      const item = g.items?.find((i) => i.id === id);
      if (item) extra += item.priceCents || 0;
    }
  }
  return extra;
}

function validateSelection(groups, selection) {
  for (const g of groups) {
    const ids = selection[g.id] || [];
    if (g.required && ids.length === 0) return `Bitte wähle eine Option: ${g.name}`;
    if (g.type === "SINGLE" && ids.length > 1) return `Nur eine Auswahl erlaubt: ${g.name}`;
    if (g.type === "MULTIPLE" && g.maxSelect && ids.length > g.maxSelect) return `Maximal ${g.maxSelect} Optionen: ${g.name}`;
  }
  return "";
}

export default function ProductClient({ product }) {
  const symbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "€";
  const groups = useMemo(() => buildGroups(product), [product]);
  const { push } = useToast();

  const [selection, setSelection] = useState(() => {
    const init = {};
    for (const g of groups) init[g.id] = [];
    for (const g of groups) {
      if (g.required && g.type === "SINGLE" && g.items?.length) init[g.id] = [g.items[0].id];
    }
    return init;
  });

  const [qty, setQty] = useState(1);
  const [err, setErr] = useState("");

  const extraCents = calcExtraCents(groups, selection);
  const unitTotal = product.priceCents + extraCents;

  function toggle(g, itemId) {
    setErr("");
    setSelection((prev) => {
      const next = { ...prev };
      const current = new Set(next[g.id] || []);
      if (g.type === "SINGLE") {
        next[g.id] = current.has(itemId) ? [] : [itemId];
      } else {
        if (current.has(itemId)) current.delete(itemId);
        else current.add(itemId);
        next[g.id] = Array.from(current);
      }
      return next;
    });
  }

  function add() {
    const msg = validateSelection(groups, selection);
    if (msg) return setErr(msg);

    const options = groups.map((g) => ({
      groupId: g.id,
      groupName: g.name,
      type: g.type,
      itemIds: selection[g.id] || [],
      items: (selection[g.id] || []).map((id) => g.items.find((i) => i.id === id)).filter(Boolean).map((i) => ({
        id: i.id,
        name: i.name,
        priceCents: i.priceCents || 0,
      })),
    }));

    for (let i = 0; i < qty; i++) addToCart(product, { options, extraPriceCents: extraCents });

    setErr("");
    push({ title: "Im Warenkorb", message: `${qty}× ${product.name} hinzugefügt.` });
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600">
        <Link className="underline" href="/menu">← Zur Speisekarte</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-soft">
          {product.imageUrl ? (<img src={product.imageUrl} alt={product.name} className="h-72 w-full object-cover bg-gray-100" />) : (<div className="h-72 w-full bg-gray-100" />)}
          <div className="p-5 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight">{product.name}</h1>
              <Badge>{product.category?.name || "Produkt"}</Badge>
            </div>
            <p className="text-gray-600">{product.description}</p>
            <div className="text-lg font-bold">{formatMoney(product.priceCents, symbol)} <span className="text-sm font-normal text-gray-500">(Basis)</span></div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-soft space-y-4">
            <div className="text-lg font-bold">Extras & Optionen</div>

            {groups.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                Keine Optionen verfügbar.
              </div>
            ) : (
              <div className="space-y-6">
                {groups.map((g) => (
                  <div key={g.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold">{g.name}</div>
                      <div className="text-xs text-gray-500">
                        {g.type === "SINGLE" ? "Einzelauswahl" : "Mehrfachauswahl"}{g.required ? " • Pflicht" : ""}
                      </div>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {g.items?.map((it) => {
                        const checked = (selection[g.id] || []).includes(it.id);
                        return (
                          <button
                            key={it.id}
                            type="button"
                            onClick={() => toggle(g, it.id)}
                            className={
                              "flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm " +
                              (checked ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:bg-gray-50")
                            }
                          >
                            <span className="font-semibold">{it.name}</span>
                            <span className="text-gray-700">{it.priceCents ? `+ ${formatMoney(it.priceCents, symbol)}` : "0,00 €"} </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {err ? <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{err}</div> : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <button className="h-10 w-10 rounded-2xl border border-gray-200" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="h-10 w-10 rounded-2xl border border-gray-200" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
              <div className="w-12 text-center font-semibold">{qty}</div>
              <button className="h-10 w-10 rounded-2xl border border-gray-200" onClick={() => setQty((q) => q + 1)}>+</button>
              <div className="ml-auto text-sm text-gray-700">
                Preis pro Stück: <span className="font-bold">{formatMoney(unitTotal, symbol)}</span>
              </div>
            </div>

            <Button onClick={add}>In den Warenkorb</Button>
            <div className="text-sm text-gray-600">
              Gesamt: <span className="font-semibold">{formatMoney(unitTotal * qty, symbol)}</span>
            </div>
          </div>

          <Button href="/cart" variant="secondary">Zum Warenkorb</Button>
        </div>
      </div>
    </div>
  );
}
