"use client";

import { useEffect, useMemo } from "react";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function deDateTime(d) {
  const dt = new Date(d);
  return `${pad2(dt.getDate())}.${pad2(dt.getMonth() + 1)}.${dt.getFullYear()} ${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
}
function money(cents, symbol = "€") {
  return `${(Number(cents || 0) / 100).toFixed(2)} ${symbol}`;
}

export default function PrintClient({ order }) {
  const symbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "€";

  const items = useMemo(() => order?.items || [], [order]);
  const subtotal = useMemo(() => items.reduce((s, it) => s + (it.lineTotalCents ?? (it.unitPriceCents * it.quantity)), 0), [items]);

  // إذا عندك deliveryFee/tax محفوظين في order استخدمهم، وإلا صفر
  const deliveryFee = Number(order?.deliveryFeeCents || 0);
  const tax = Number(order?.taxCents || 0);
  const total = Number(order?.totalCents ?? (subtotal + deliveryFee + tax));

  useEffect(() => {
    const t = setTimeout(() => window.print(), 250);
    return () => clearTimeout(t);
  }, []);

  const isPickup = order?.fulfillmentMethod === "PICKUP";

  return (
    <div className="receipt">
      {/* HEADER */}
      <div className="center">
        <div className="brand">GRILL MASTER</div>
        <div className="muted">Online-Bestellung</div>
      </div>

      <div className="hr" />

      {/* ORDER META */}
      <div className="row">
        <div className="label">Bestellung</div>
        <div className="value big">#{String(order.id).slice(-6)}</div>
      </div>

      <div className="row">
        <div className="label">Zeit</div>
        <div className="value">{deDateTime(order.createdAt)}</div>
      </div>

      <div className="row">
        <div className="label">Art</div>
        <div className="value">{isPickup ? "ABHOLUNG" : "LIEFERUNG"}</div>
      </div>

      <div className="row">
        <div className="label">Zahlung</div>
        <div className="value">{order.paymentMethod}/{order.paymentStatus}</div>
      </div>

      <div className="hr" />

      {/* CUSTOMER */}
      <div className="sectionTitle">KUNDE</div>
      <div className="block">
        <div className="strong">{order.customerName || "-"}</div>
        <div>{order.phone || "-"}</div>
      </div>

      {!isPickup ? (
        <>
          <div className="sectionTitle">LIEFERADRESSE</div>
          <div className="block">
            <div className="strong">{order.address || "-"}</div>
          </div>
        </>
      ) : null}

      {order.notes ? (
        <>
          <div className="sectionTitle">NOTIZ</div>
          <div className="block note">{order.notes}</div>
        </>
      ) : null}

      <div className="hr" />

      {/* ITEMS */}
      <div className="sectionTitle">ARTIKEL</div>

      <div className="items">
        {items.map((it) => (
          <div key={it.id} className="itemRow">
            <div className="qty">{it.quantity}x</div>
            <div className="name">
              <div className="strong">{it.nameSnapshot}</div>

              {/* خيارات/Extras إن وُجدت */}
              {it.selectedOptionsJson ? (
                <div className="muted small">{String(it.selectedOptionsJson)}</div>
              ) : null}
            </div>
            <div className="price">{money(it.lineTotalCents ?? (it.unitPriceCents * it.quantity), symbol)}</div>
          </div>
        ))}
      </div>

      <div className="hr" />

      {/* TOTALS */}
      <div className="totals">
        <div className="row">
          <div className="label">Zwischensumme</div>
          <div className="value">{money(subtotal, symbol)}</div>
        </div>

        {deliveryFee ? (
          <div className="row">
            <div className="label">Liefergebühr</div>
            <div className="value">{money(deliveryFee, symbol)}</div>
          </div>
        ) : null}

        {tax ? (
          <div className="row">
            <div className="label">MwSt.</div>
            <div className="value">{money(tax, symbol)}</div>
          </div>
        ) : null}

        <div className="row total">
          <div className="label">GESAMT</div>
          <div className="value">{money(total, symbol)}</div>
        </div>
      </div>

      <div className="hr" />

      {/* FOOTER */}
      <div className="center muted small">
        Danke & guten Appetit!
      </div>

      {/* CSS داخل نفس الملف */}
      <style jsx global>{`
        /* طباعة مثل Lieferando: ورقة حرارية 80mm */
        @page {
          size: 80mm auto;
          margin: 6mm;
        }

        /* إخفاء أي Layout حوالي الصفحة */
        header, nav, footer {
          display: none !important;
        }

        body {
          background: white !important;
        }

        .receipt {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          color: #000;
          font-size: 12px;
          line-height: 1.25;
          width: 100%;
        }

        .center { text-align: center; }
        .brand { font-size: 18px; font-weight: 900; letter-spacing: 0.5px; }
        .muted { opacity: 0.75; }
        .strong { font-weight: 800; }
        .big { font-size: 16px; font-weight: 900; }

        .hr {
          border-top: 1px dashed #000;
          margin: 10px 0;
        }

        .sectionTitle {
          font-weight: 900;
          letter-spacing: 0.6px;
          margin-bottom: 6px;
        }

        .block { margin-bottom: 10px; }
        .note { white-space: pre-wrap; }

        .row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin: 2px 0;
        }

        .label {
          font-weight: 700;
        }

        .value {
          text-align: right;
          font-weight: 700;
        }

        .items {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .itemRow {
          display: grid;
          grid-template-columns: 28px 1fr auto;
          gap: 8px;
          align-items: start;
        }

        .qty {
          font-weight: 900;
        }

        .name {
          min-width: 0;
        }

        .price {
          text-align: right;
          font-weight: 800;
          white-space: nowrap;
        }

        .small { font-size: 11px; }

        .totals .total .label,
        .totals .total .value {
          font-size: 14px;
          font-weight: 900;
        }

        /* يخلي الطباعة نظيفة */
        @media print {
          .receipt { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
