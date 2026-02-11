"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [token, setToken] = useState("");
  const [err, setErr] = useState("");

  function login() {
    if (!token) {
      setErr("Bitte ADMIN_TOKEN eingeben");
      return;
    }

    // نحفظ التوكن كـ Cookie (الميدل وير يقرأه)
    document.cookie = `admin_token=${token}; path=/; max-age=604800`;
    location.href = "/admin";
  }

  return (
    <div className="mx-auto mt-24 max-w-sm space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-soft">
      <h1 className="text-xl font-extrabold">Admin Login</h1>

      <input
        className="w-full rounded-xl border border-gray-300 p-2"
        placeholder="ADMIN_TOKEN"
        value={token}
        onChange={(e) => setToken(e.target.value)}
      />

      <button
        className="w-full rounded-xl bg-black p-2 text-white hover:bg-gray-800"
        onClick={login}
      >
        Anmelden
      </button>

      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}
