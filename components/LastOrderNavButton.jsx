"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DONE = new Set(["DELIVERED", "CANCELED", "CANCELLED"]);

export default function LastOrderNavButton() {
  const [id, setId] = useState("");

  async function validate(orderId) {
    if (!orderId) return;

    try {
      const res = await fetch(`/api/order/${orderId}`, { cache: "no-store" });
      const data = await res.json();

      console.log("[last_order] validate", orderId, data?.status);

      if (res.ok && DONE.has(data?.status)) {
        console.log("[last_order] DONE -> removing last_order_id");
        localStorage.removeItem("last_order_id");
        setId("");
        return;
      }

      // إذا الطلب لسا شغال خلي الزر ظاهر
      setId(orderId);
    } catch (e) {
      console.log("[last_order] validate error", e);
    }
  }

  useEffect(() => {
    const current = localStorage.getItem("last_order_id") || "";
    setId(current);
    validate(current);

    const t = setInterval(() => {
      const v = localStorage.getItem("last_order_id") || "";
      if (v) validate(v);
      else setId("");
    }, 5000);

    const onFocus = () => {
      const v = localStorage.getItem("last_order_id") || "";
      if (v) validate(v);
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (!id) return null;

  return (

    <Link href="/bestellung" className="rounded-full bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800">
      Bestellung ansehen
    </Link>
  );
}
