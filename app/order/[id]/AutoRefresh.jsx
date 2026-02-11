"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoRefresh({ intervalMs = 10000 }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(t);
  }, [router, intervalMs]);
  return null;
}
