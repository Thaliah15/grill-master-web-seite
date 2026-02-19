"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button, Input, Textarea, Badge } from "/components/ui";
import { formatMoney } from "/lib/money";

function toCents(eurString) {
  const s = String(eurString ?? "").replace(",", ".").trim();
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}
function fromCents(cents) {
  return ((cents ?? 0) / 100).toFixed(2);
}
function formatDateTime(d) {
  if (!d) return "-";
  const dt = new Date(d);
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dt);
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [ordersRange, setOrdersRange] = useState("today"); // today | 7d | all

  const [tab, setTab] = useState("orders");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);

  const [catForm, setCatForm] = useState({ name: "", sortOrder: 0 });
  const [prodForm, setProdForm] = useState({
    name: "",
    description: "",
    priceEur: "",
    imageUrl: "",
    categoryId: "",
    isActive: true,
  });
  const [settingsForm, setSettingsForm] = useState({
    openTime: "11:00",
    closeTime: "22:00",
    minOrderEur: "15.00",
    deliveryFeeEur: "3.00",
    enablePickup: true,
    enableDelivery: true,
    notifyEmailTo: "",
    notifyEmailFrom: "",
    whatsappTo: "",
    whatsappEnabled: false,
  });

  const createFileRef = useRef(null);
  const rowFileRefs = useRef({});
  const symbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "€";

  useEffect(() => {
    const t = sessionStorage.getItem("admin_token");
    if (t) {
      setToken(t);
      setAuthed(true);
    }
  }, []);

  async function api(path, options = {}) {
    const headers = { ...(options.headers || {}), "x-admin-token": token };
    const res = await fetch(path, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Fehler");
    return data;
  }

  async function uploadFile(file) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      headers: { "x-admin-token": token },
      body: fd,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Upload fehlgeschlagen");
    return data.url;
  }

  async function loadAll() {
    setErr("");
    setLoading(true);
    try {
      const [o, p, c, s] = await Promise.all([
        api(`/api/admin/orders?range=${ordersRange}`),
        api("/api/admin/products"),
        api("/api/admin/categories"),
        api("/api/admin/settings"),
      ]);

      setOrders(Array.isArray(o) ? o : []);
      setProducts(Array.isArray(p) ? p : []);
      setCategories(Array.isArray(c) ? c : []);
      setSettings(s || null);

      const ss = s || {};
      setSettingsForm((prev) => ({
        ...prev,
        openTime: ss.openTime || "11:00",
        closeTime: ss.closeTime || "22:00",
        minOrderEur: fromCents(ss.minOrderCents ?? 1500),
        deliveryFeeEur: fromCents(ss.deliveryFeeCents ?? 300),
        enablePickup: !!ss.enablePickup,
        enableDelivery: !!ss.enableDelivery,
      }));
    } catch (e) {
      setErr(e.message);
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    document.cookie = "admin_token=; path=/; max-age=0";
    sessionStorage.removeItem("admin_token");
    location.href = "/";
  }

  async function login() {
    // ✅ خلّي الاثنين موجودين لأن api() يعتمد على state+sessionStorage
    document.cookie = `admin_token=${token}; path=/; max-age=604800`;
    sessionStorage.setItem("admin_token", token);

    setAuthed(true);
    await loadAll();
  }

  // ✅ تحميل ثابت عند تغيّر التوكن/الفلتر (وبس لما تكون authed)
  useEffect(() => {
    if (authed && token) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, token, ordersRange]);

  // ✅ تحديث تلقائي للطلبات فقط (بدون ما يحمّل كل شي) كل 5 ثواني
  useEffect(() => {
    if (!authed || !token) return;
    if (tab !== "orders") return;

    const tick = async () => {
      try {
        const o = await api(`/api/admin/orders?range=${ordersRange}`);
        setOrders(Array.isArray(o) ? o : []);
      } catch {}
    };

    tick();
    const t = setInterval(tick, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, token, tab, ordersRange]);

  async function updateStatus(orderId, status) {
    await api("/api/admin/orders", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    await loadAll();
  }

  async function createCategory() {
    await api("/api/admin/categories", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: catForm.name, sortOrder: Number(catForm.sortOrder) }),
    });
    setCatForm({ name: "", sortOrder: 0 });
    await loadAll();
  }

  async function updateCategory(categoryId, patch) {
    await api("/api/admin/categories", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ categoryId, ...patch }),
    });
    await loadAll();
  }

  async function deleteCategory(categoryId) {
    if (!confirm("Kategorie wirklich löschen?")) return;
    await api("/api/admin/categories", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ categoryId }),
    });
    await loadAll();
  }

  async function createProduct() {
    const cents = toCents(prodForm.priceEur);
    if (cents == null) throw new Error("Preis ungültig.");

    let finalImageUrl = prodForm.imageUrl || "";
    const f = createFileRef.current?.files?.[0];
    if (f) {
      finalImageUrl = await uploadFile(f);
      createFileRef.current.value = "";
    }

    await api("/api/admin/products", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: prodForm.name,
        description: prodForm.description,
        priceCents: cents,
        imageUrl: finalImageUrl,
        categoryId: prodForm.categoryId || null,
        isActive: !!prodForm.isActive,
      }),
    });
    setProdForm({ name: "", description: "", priceEur: "", imageUrl: "", categoryId: "", isActive: true });
    await loadAll();
  }

  async function patchProduct(productId, patch) {
    await api("/api/admin/products", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId, ...patch }),
    });
    await loadAll();
  }

  async function uploadProductImage(productId) {
    const input = rowFileRefs.current[productId];
    const file = input?.files?.[0];
    if (!file) throw new Error("Bitte eine Datei auswählen.");
    const url = await uploadFile(file);
    input.value = "";
    await patchProduct(productId, { imageUrl: url });
  }

  async function deleteProduct(productId) {
    if (!confirm("Produkt wirklich löschen?")) return;
    await api("/api/admin/products", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    await loadAll();
  }

  async function saveSettings() {
    const minCents = toCents(settingsForm.minOrderEur);
    const feeCents = toCents(settingsForm.deliveryFeeEur);
    if (minCents == null || feeCents == null) throw new Error("Beträge ungültig.");

    const s = await api("/api/admin/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        openTime: settingsForm.openTime,
        closeTime: settingsForm.closeTime,
        minOrderCents: minCents,
        deliveryFeeCents: feeCents,
        enablePickup: settingsForm.enablePickup,
        enableDelivery: settingsForm.enableDelivery,
        notifyEmailTo: settingsForm.notifyEmailTo || null,
        notifyEmailFrom: settingsForm.notifyEmailFrom || null,
        whatsappTo: settingsForm.whatsappTo || null,
        whatsappEnabled: !!settingsForm.whatsappEnabled,
      }),
    });

    setSettings(s);
    setErr("");
  }

  const sortedCategories = useMemo(
    () => [...(Array.isArray(categories) ? categories : [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [categories]
  );

  if (!authed) {
    return (
      <div className="max-w-xl space-y-4">
        <h1 className="text-2xl font-extrabold tracking-tight">Admin</h1>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          Bitte den <strong>ADMIN_TOKEN</strong> aus der <code>.env</code> eingeben.
        </div>
        <Input placeholder="ADMIN_TOKEN" value={token} onChange={(e) => setToken(e.target.value)} />
        <Button onClick={() => login().catch((e) => setErr(e.message))}>Anmelden</Button>
        {err && <p className="text-sm text-rose-700">{err}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Admin</h1>
          <p className="text-sm text-gray-600">Bestellungen, Kategorien, Produkte und Einstellungen verwalten.</p>
        </div>
        <div className="flex gap-2">
          <Button href="/menu" variant="secondary">
            Zur Website
          </Button>
          <Button variant="secondary" onClick={() => loadAll()} disabled={loading}>
            {loading ? "Lade..." : "Aktualisieren"}
          </Button>
          {/* إذا بدك زر خروج */}
          {/* <Button variant="secondary" onClick={logout}>Logout</Button> */}
        </div>
      </div>

      {err && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{err}</div>}

      <div className="flex flex-wrap gap-2">
        {[
          ["orders", "Bestellungen"],
          ["settings", "Einstellungen"],
          ["categories", "Kategorien"],
          ["products", "Produkte"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={
              "rounded-full px-3 py-1 text-sm font-semibold " +
              (tab === k ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200")
            }
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "orders" ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">Bestellungen</h2>
            {settings ? (
              <>
                <Badge>
                  Öffnungszeiten: {settings.openTime} – {settings.closeTime}
                </Badge>
                <Badge>Mindestbestellwert: {formatMoney(settings.minOrderCents, symbol)}</Badge>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-gray-700">Filter:</div>
            {[
              ["today", "Heute"],
              ["7d", "Letzte 7 Tage"],
              ["all", "Alle"],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setOrdersRange(k)}
                className={
                  "rounded-full px-3 py-1 text-sm font-semibold " +
                  (ordersRange === k ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200")
                }
              >
                {label}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-200 shadow-soft">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold">Nr.</th>
                  <th className="px-4 py-3 font-semibold">Datum/Zeit</th>
                  <th className="px-4 py-3 font-semibold">Kunde</th>
                  <th className="px-4 py-3 font-semibold">Art</th>
                  <th className="px-4 py-3 font-semibold">Zahlung</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(orders) ? orders : []).map((o) => (
                  <tr key={o.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <Link href={`/order/${o.id}`} className="font-semibold underline">
                        {o.id.slice(-6)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">{formatDateTime(o.createdAt)}</td>
                    <td className="px-4 py-3">{o.customerName}</td>
                    <td className="px-4 py-3">{o.fulfillmentMethod === "PICKUP" ? "Abholung" : "Lieferung"}</td>
                    <td className="px-4 py-3">
                      {o.paymentMethod}/{o.paymentStatus}
                    </td>
                    <td className="px-4 py-3">{o.status}</td>
                    <td className="px-4 py-3">
                      <select
                        className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm"
                        defaultValue={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value).catch((er) => setErr(er.message))}
                      >
                        {["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELED"].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {(Array.isArray(orders) ? orders : []).length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-gray-500" colSpan={7}>
                      Keine Bestellungen.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "settings" ? (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Einstellungen</h2>

          <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-soft space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-sm font-semibold">Öffnungszeit</div>
                <Input
                  placeholder="11:00"
                  value={settingsForm.openTime}
                  onChange={(e) => setSettingsForm({ ...settingsForm, openTime: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold">Schließzeit</div>
                <Input
                  placeholder="22:00"
                  value={settingsForm.closeTime}
                  onChange={(e) => setSettingsForm({ ...settingsForm, closeTime: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold">Mindestbestellwert (€)</div>
                <Input
                  placeholder="15.00"
                  value={settingsForm.minOrderEur}
                  onChange={(e) => setSettingsForm({ ...settingsForm, minOrderEur: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold">Liefergebühr (€)</div>
                <Input
                  placeholder="3.00"
                  value={settingsForm.deliveryFeeEur}
                  onChange={(e) => setSettingsForm({ ...settingsForm, deliveryFeeEur: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!settingsForm.enableDelivery}
                  onChange={(e) => setSettingsForm({ ...settingsForm, enableDelivery: e.target.checked })}
                />
                Lieferung erlauben
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!settingsForm.enablePickup}
                  onChange={(e) => setSettingsForm({ ...settingsForm, enablePickup: e.target.checked })}
                />
                Abholung erlauben
              </label>
            </div>

            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <div className="text-sm font-semibold">Bestell-E-Mail (Empfänger)</div>
                <Input
                  placeholder="restaurant@email.de"
                  value={settingsForm.notifyEmailTo}
                  onChange={(e) => setSettingsForm({ ...settingsForm, notifyEmailTo: e.target.value })}
                />
                <div className="text-xs text-gray-500">Hierhin gehen neue Bestellungen per E-Mail.</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold">E-Mail Absender (optional)</div>
                <Input
                  placeholder="no-reply@restaurant.de"
                  value={settingsForm.notifyEmailFrom}
                  onChange={(e) => setSettingsForm({ ...settingsForm, notifyEmailFrom: e.target.value })}
                />
                <div className="text-xs text-gray-500">Wenn leer, wird SMTP_USER verwendet.</div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-semibold">WhatsApp Nummer (Empfänger)</div>
                <Input
                  placeholder="+491701234567"
                  value={settingsForm.whatsappTo}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsappTo: e.target.value })}
                />
                <div className="text-xs text-gray-500">Nur E.164 Format (mit +49...).</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold">WhatsApp aktivieren</div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!settingsForm.whatsappEnabled}
                    onChange={(e) => setSettingsForm({ ...settingsForm, whatsappEnabled: e.target.checked })}
                  />
                  Bestellungen per WhatsApp senden
                </label>
                <div className="text-xs text-gray-500">Twilio muss in .env konfiguriert sein.</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => saveSettings().catch((e) => setErr(e.message))}>Speichern</Button>
              <div className="text-xs text-gray-500">
                Hinweis: Öffnungszeiten werden in Europa/Berlin geprüft. Bei Nachtbetrieb (z.B. 18:00–02:00) funktioniert es
                auch.
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {tab === "categories" ? (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Kategorien</h2>

          <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-soft space-y-3">
            <div className="text-sm font-semibold">Neue Kategorie</div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Input placeholder="Name (z.B. Pizza)" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
              <Input type="number" placeholder="Sortierung" value={catForm.sortOrder} onChange={(e) => setCatForm({ ...catForm, sortOrder: e.target.value })} />
              <Button onClick={() => createCategory().catch((e) => setErr(e.message))}>Speichern</Button>
            </div>
            <p className="text-xs text-gray-500">Tipp: Sortierung 1..n steuert die Reihenfolge in der Speisekarte.</p>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-200 shadow-soft">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Sortierung</th>
                  <th className="px-4 py-3 font-semibold">Produkte</th>
                  <th className="px-4 py-3 font-semibold">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {sortedCategories.map((c) => (
                  <tr key={c.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <Input defaultValue={c.name} onBlur={(e) => updateCategory(c.id, { name: e.target.value }).catch((er) => setErr(er.message))} />
                    </td>
                    <td className="px-4 py-3 w-40">
                      <Input type="number" defaultValue={c.sortOrder} onBlur={(e) => updateCategory(c.id, { sortOrder: Number(e.target.value) }).catch((er) => setErr(er.message))} />
                    </td>
                    <td className="px-4 py-3">{c._count?.products ?? 0}</td>
                    <td className="px-4 py-3">
                      <Button variant="danger" onClick={() => deleteCategory(c.id).catch((er) => setErr(er.message))}>
                        Löschen
                      </Button>
                    </td>
                  </tr>
                ))}
                {sortedCategories.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-gray-500" colSpan={4}>
                      Keine Kategorien.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {tab === "products" ? (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Produkte</h2>

          <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-soft space-y-3">
            <div className="text-sm font-semibold">Neues Produkt</div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Name" value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} />
              <Input placeholder="Preis (EUR) z.B. 9.90" value={prodForm.priceEur} onChange={(e) => setProdForm({ ...prodForm, priceEur: e.target.value })} />
              <div className="space-y-2">
                <Input placeholder="Bild-URL (optional)" value={prodForm.imageUrl} onChange={(e) => setProdForm({ ...prodForm, imageUrl: e.target.value })} />
                <input ref={createFileRef} type="file" accept="image/png,image/jpeg,image/webp" className="block w-full text-sm" />
                <p className="text-xs text-gray-500">Upload: JPG/PNG/WEBP, max 5MB.</p>
              </div>
              <select
                className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm"
                value={prodForm.categoryId}
                onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
              >
                <option value="">(Keine Kategorie)</option>
                {sortedCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="sm:col-span-2">
                <Textarea rows={3} placeholder="Beschreibung (optional)" value={prodForm.description} onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!prodForm.isActive} onChange={(e) => setProdForm({ ...prodForm, isActive: e.target.checked })} />
                Aktiv
              </label>
              <div className="sm:col-span-2">
                <Button onClick={() => createProduct().catch((e) => setErr(e.message))}>Speichern</Button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-200 shadow-soft">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Kategorie</th>
                  <th className="px-4 py-3 font-semibold">Preis</th>
                  <th className="px-4 py-3 font-semibold">Aktiv</th>
                  <th className="px-4 py-3 font-semibold">Bild</th>
                  <th className="px-4 py-3 font-semibold">Aktion</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(products) ? products : []).map((p) => (
                  <tr key={p.id} className="border-t border-gray-100 align-top">
                    <td className="px-4 py-3">
                      <Input defaultValue={p.name} onBlur={(e) => patchProduct(p.id, { name: e.target.value }).catch((er) => setErr(er.message))} />
                      <div className="mt-2">
                        <Textarea defaultValue={p.description || ""} rows={2} onBlur={(e) => patchProduct(p.id, { description: e.target.value }).catch((er) => setErr(er.message))} />
                      </div>
                    </td>
                    <td className="px-4 py-3 w-56">
                      <select
                        className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm"
                        value={p.categoryId || ""}
                        onChange={(e) => patchProduct(p.id, { categoryId: e.target.value || null }).catch((er) => setErr(er.message))}
                      >
                        <option value="">(Keine Kategorie)</option>
                        {sortedCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 w-40">
                      <Input
                        defaultValue={fromCents(p.priceCents)}
                        onBlur={(e) => {
                          const cents = toCents(e.target.value);
                          if (cents == null) return setErr("Preis ungültig.");
                          patchProduct(p.id, { priceCents: cents }).catch((er) => setErr(er.message));
                        }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={!!p.isActive} onChange={(e) => patchProduct(p.id, { isActive: e.target.checked }).catch((er) => setErr(er.message))} />
                    </td>
                    <td className="px-4 py-3 w-80 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-20 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p.imageUrl || ""} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="text-xs text-gray-600 break-all">{p.imageUrl || "(kein Bild)"}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input type="file" accept="image/png,image/jpeg,image/webp" className="block w-full text-sm" ref={(el) => (rowFileRefs.current[p.id] = el)} />
                        <Button variant="secondary" onClick={() => uploadProductImage(p.id).catch((e) => setErr(e.message))}>
                          Upload
                        </Button>
                      </div>

                      <div className="text-xs text-gray-500">Oder per URL:</div>
                      <Input defaultValue={p.imageUrl || ""} onBlur={(e) => patchProduct(p.id, { imageUrl: e.target.value }).catch((er) => setErr(er.message))} />
                    </td>
                    <td className="px-4 py-3 space-y-2">
                      <Button variant="danger" onClick={() => deleteProduct(p.id).catch((er) => setErr(er.message))}>
                        Löschen
                      </Button>
                    </td>
                  </tr>
                ))}
                {(Array.isArray(products) ? products : []).length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-gray-500" colSpan={6}>
                      Keine Produkte.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <strong>Hinweis:</strong> Uploads werden lokal unter <code>/public/uploads</code> gespeichert. Für Produktion können wir Cloudinary/S3 anbinden.
          </div>
        </section>
      ) : null}
    </div>
  );
}
