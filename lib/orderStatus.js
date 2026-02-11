export const STATUS_STEPS_DELIVERY = [
  { key: "PENDING", label: "Eingegangen" },
  { key: "PREPARING", label: "In Vorbereitung" },
  { key: "OUT_FOR_DELIVERY", label: "Unterwegs" },
  { key: "DELIVERED", label: "Geliefert" },
];

export const STATUS_STEPS_PICKUP = [
  { key: "PENDING", label: "Eingegangen" },
  { key: "PREPARING", label: "In Vorbereitung" },
  { key: "DELIVERED", label: "Fertig / Abgeholt" },
];

export function getSteps(fulfillmentMethod) {
  return fulfillmentMethod === "DELIVERY" ? STATUS_STEPS_DELIVERY : STATUS_STEPS_PICKUP;
}

export function getStepIndex(steps, status) {
  const idx = steps.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}
