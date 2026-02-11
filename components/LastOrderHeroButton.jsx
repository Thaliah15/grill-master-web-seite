"use client";
import Link from "next/link"; 
import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

export default function LastOrderHeroButton() {
  const [id, setId] = useState("");

  useEffect(() => {
    setId(localStorage.getItem("last_order_id") || "");
  }, []);

  if (!id) return null;

  return (
    <Link href="/bestellung" className="rounded-full bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800">
    Bestellung ansehen
    </Link>
  );
}
