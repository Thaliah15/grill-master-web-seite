"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";

const KEY = "cookie_consent_v1";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (!v) setShow(true);
    } catch {
      // ignore
    }
  }, []);

  function accept() {
    localStorage.setItem(KEY, "accepted");
    setShow(false);
  }

  function decline() {
    localStorage.setItem(KEY, "declined");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto max-w-3xl rounded-3xl border border-gray-200 bg-white p-4 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-700">
            Wir verwenden nur technisch notwendige Cookies/LocalStorage (z. B. Warenkorb & Einwilligung). Mehr Infos in{" "}
            <Link className="font-semibold underline" href="/datenschutz">Datenschutz</Link>.
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={decline}>Ablehnen</Button>
            <Button onClick={accept}>Akzeptieren</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
