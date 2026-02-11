function statusClass(status) {
  if (status === "PENDING") return "bg-gray-100 text-gray-800 border-gray-200";
  if (status === "CONFIRMED") return "bg-blue-50 text-blue-800 border-blue-200";
  if (status === "PREPARING") return "bg-amber-50 text-amber-900 border-amber-200";
  if (status === "OUT_FOR_DELIVERY") return "bg-indigo-50 text-indigo-900 border-indigo-200";
  if (status === "DELIVERED") return "bg-emerald-50 text-emerald-900 border-emerald-200";
  if (status === "CANCELED") return "bg-rose-50 text-rose-900 border-rose-200";
  return "bg-gray-100 text-gray-800 border-gray-200";
}

function statusLabel(status) {
  const map = {
    PENDING: "Eingegangen",
    CONFIRMED: "Bestätigt",
    PREPARING: "In Vorbereitung",
    OUT_FOR_DELIVERY: "Unterwegs",
    DELIVERED: "Geliefert",
    CANCELED: "Storniert",
  };
  return map[status] || status;
}
