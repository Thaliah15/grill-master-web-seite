"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button, Badge } from "/components/ui";

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

const COLS = [
  { key: "new", title: "Neu", statuses: ["PENDING", "CONFIRMED"] },
  { key: "prep", title: "In Arbeit", statuses: ["PREPARING"] },
  { key: "out", title: "Unterwegs", statuses: ["OUT_FOR_DELIVERY"] },
  { key: "done", title: "Fertig", statuses: ["DELIVERED", "CANCELED"] },
];

function statusLabel(s) {
  const m = {
    PENDING: "Neu",
    CONFIRMED: "Bestätigt",
    PREPARING: "Zubereitung",
    OUT_FOR_DELIVERY: "Unterwegs",
    DELIVERED: "Geliefert",
    CANCELED: "Storniert",
  };
  return m[s] || s;
}

function getCookie(name) {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // ✅ زر واحد للصوت
  const [soundOn, setSoundOn] = useState(false);
  const [soundUnlocked, setSoundUnlocked] = useState(false);

  const audioRef = useRef(null);
  const alarmTimerRef = useRef(null);
  const alarmOrderIdRef = useRef(null);

  async function api(path, options = {}) {
    const token = getCookie("admin_token");
    const headers = { ...(options.headers || {}) };
    if (token) headers["x-admin-token"] = token;

    const res = await fetch(path, {
      ...options,
      headers,
      cache: "no-store",
      credentials: "same-origin",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || "Fehler");
    return data;
  }

  async function load() {
    const list = await api("/api/admin/orders?range=today");
    setOrders(Array.isArray(list) ? list : []);
  }

  // ✅ أهم تعديل: المسار الصحيح للصوت
  useEffect(() => {
    audioRef.current = new Audio("/sounds/new-order.wav"); // ✅ صح
    audioRef.current.preload = "auto";
    audioRef.current.loop = false;
    audioRef.current.volume = 1;
  }, []);

  async function unlockSound() {
    if (!audioRef.current) return false;
    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play(); // لازم click
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setSoundUnlocked(true);
      return true;
    } catch (e) {
      console.log("Sound unlock blocked:", e);
      return false;
    }
  }

  async function playOnce() {
    if (!soundOn) return;
    if (!audioRef.current) return;
    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (e) {
      console.log("play blocked:", e);
    }
  }

  function startAlarm(orderId) {
    if (!soundOn) return;
    if (alarmOrderIdRef.current === orderId && alarmTimerRef.current) return;

    stopAlarm();
    alarmOrderIdRef.current = orderId;

    playOnce();
    alarmTimerRef.current = setInterval(() => {
      playOnce();
    }, 2000);
  }

  function stopAlarm() {
    alarmOrderIdRef.current = null;
    if (alarmTimerRef.current) {
      clearInterval(alarmTimerRef.current);
      alarmTimerRef.current = null;
    }
  }

  // ✅ تحميل أولي + تحديث كل 3 ثواني
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");
        await load();
      } catch (e) {
        if (alive) setErr(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    const tick = async () => {
      try {
        const list = await api("/api/admin/orders?range=today");
        const arr = Array.isArray(list) ? list : [];
        setOrders(arr);

        // ✅ أول طلب جديد
        const firstNew = arr.find((o) => o.status === "PENDING" || o.status === "CONFIRMED");
        if (firstNew) {
          startAlarm(firstNew.id);
        } else {
          stopAlarm();
        }
      } catch (e) {
        setErr(e.message || "Fehler");
      }
    };

    const t = setInterval(tick, 3000);
    return () => {
      alive = false;
      clearInterval(t);
      stopAlarm();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundOn]);

  async function updateStatus(orderId, status) {
    await api("/api/admin/orders", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
  }

  async function acceptAndPrint(orderId) {
    try {
      setErr("");
      stopAlarm();

      await updateStatus(orderId, "PREPARING");

      const w = window.open(`/print/${orderId}`, "_blank", "width=900,height=900");
      if (!w) alert("المتصفح منع فتح نافذة الطباعة. فعّل Popups.");

      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function toggleSound() {
    if (soundOn) {
      setSoundOn(false);
      stopAlarm();
      return;
    }

    // تشغيل
    if (!soundUnlocked) {
      const ok = await unlockSound();
      if (!ok) {
        alert("المتصفح مانع الصوت. اضغط مرة ثانية أو فعّل الصوت من إعدادات المتصفح.");
        return;
      }
    }
    setSoundOn(true);
  }

  const grouped = useMemo(() => {
    const map = {};
    for (const c of COLS) map[c.key] = [];
    for (const o of orders) {
      const col = COLS.find((c) => c.statuses.includes(o.status))?.key || "new";
      map[col].push(o);
    }
    return map;
  }, [orders]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Tablet / Küche</h1>
          <p className="text-sm text-gray-600">Live-Ansicht wie Lieferando: neue Bestellungen + Status.</p>
        </div>

        <div className="flex gap-2">
          <Button href="/admin" variant="secondary">Admin</Button>
          <Button onClick={() => load().catch(() => {})} variant="secondary">Aktualisieren</Button>

          <Button variant={soundOn ? "primary" : "secondary"} onClick={toggleSound}>
            {soundOn ? "🔊 Sound: AN" : "🔇 Sound: AUS"}
          </Button>
        </div>
      </div>

      {err ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
          {err}
        </div>
      ) : null}

      {loading ? <div className="text-sm text-gray-600">Lade…</div> : null}

      <div className="grid gap-3 lg:grid-cols-4">
        {COLS.map((c) => (
          <div key={c.key} className="rounded-3xl border border-gray-200 bg-white shadow-soft overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
              <div className="font-bold">{c.title}</div>
              <Badge>{grouped[c.key]?.length || 0}</Badge>
            </div>

            <div className="p-3 space-y-3">
              {(grouped[c.key] || []).map((o) => (
                <div key={o.id} className="rounded-2xl border border-gray-200 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold">
                      <Link className="underline" href={`/order/${o.id}`}>#{o.id.slice(-6)}</Link>
                    </div>
                    <div className="text-xs text-gray-600">{formatDateTime(o.createdAt)}</div>
                  </div>

                  <div className="mt-2 text-sm">
                    <div><strong>{o.customerName}</strong></div>
                    <div className="text-gray-700">{o.fulfillmentMethod === "PICKUP" ? "Abholung" : "Lieferung"}</div>
                    <div className="text-xs text-gray-600">{statusLabel(o.status)}</div>
                  </div>

                  {(o.status === "PENDING" || o.status === "CONFIRMED") ? (
                    <div className="mt-3">
                      <Button onClick={() => acceptAndPrint(o.id)} className="w-full">
                        ✅ Annehmen & Drucken
                      </Button>
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {["CONFIRMED","PREPARING","OUT_FOR_DELIVERY","DELIVERED","CANCELED"].map((s) => (
                      <button
                        key={s}
                        onClick={async () => {
                          try {
                            await updateStatus(o.id, s);
                            await load();
                          } catch (e) {
                            setErr(e.message);
                          }
                        }}
                        className={
                          "rounded-full px-3 py-1 text-xs font-semibold border " +
                          (o.status === s ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50")
                        }
                      >
                        {statusLabel(s)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {(grouped[c.key] || []).length === 0 ? (
                <div className="text-sm text-gray-500">Keine Bestellungen.</div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
