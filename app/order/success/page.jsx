import { Button } from "/components/ui";

export default function SuccessPage({ searchParams }) {
  const sid = searchParams?.session_id;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Weiterleitung zur Zahlung</h1>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-gray-700">
        Nach erfolgreicher Zahlung wird die Bestellung über den Stripe-Webhook automatisch als <strong>bezahlt</strong> markiert.
      </div>
      {sid ? (
        <p className="text-sm text-gray-600">
          Stripe Session: <code className="rounded bg-gray-100 px-2 py-1">{sid}</code>
        </p>
      ) : null}
      <Button href="/menu" variant="secondary">Zurück zum Menü</Button>
    </div>
  );
}
