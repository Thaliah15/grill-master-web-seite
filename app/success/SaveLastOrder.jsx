"use client";
import { useEffect } from "react";

export default function SaveLastOrder({ orderId }) {
  useEffect(() => {
    if (orderId){ localStorage.setItem("last_order_id", orderId);
        window.dispatchEvent(new Event("last_order_changed"));
    }

  }, [orderId]);

  return null;
}
