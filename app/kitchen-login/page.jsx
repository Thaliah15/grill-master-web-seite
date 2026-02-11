"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function KitchenLogin() {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const router = useRouter();

  async function submit() {
    setErr("");
    const res = await fetch("/api/kitchen/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setErr(data?.error || "Falsch");
    router.push("/kitchen");
  }

  return (
    <div className="mx-auto max-w-sm space-y-3">
      <h1 className="text-2xl font-extrabold">Kitchen Login</h1>
      <input
        className="w-full rounded-2xl border px-3 py-2"
        placeholder="PIN"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        type="password"
      />
      <button
        className="w-full rounded-2xl bg-black text-white py-2 font-semibold"
        onClick={submit}
      >
        Start
      </button>
      {err ? <div className="text-sm text-red-600">{err}</div> : null}
    </div>
  );
}
