"use client";

import { useEffect, useState } from "react";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const ok = localStorage.getItem("cookie_ok");
      if (!ok) setShow(true);
    } catch {}
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 16,
      left: 16,
      right: 16,
      zIndex: 50,
      background: "white",
      border: "1px solid #e5e5e5",
      borderRadius: 16,
      padding: 14,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12
    }}>
      <div style={{ fontSize: 14, color: "#111" }}>
        Wir verwenden Cookies, um die Website zu verbessern.
      </div>
      <button
        onClick={() => {
          try { localStorage.setItem("cookie_ok", "1"); } catch {}
          setShow(false);
        }}
        style={{
          background: "#111",
          color: "white",
          padding: "10px 14px",
          borderRadius: 12,
          fontWeight: "700",
          border: "none"
        }}
      >
        OK
      </button>
    </div>
  );
}
