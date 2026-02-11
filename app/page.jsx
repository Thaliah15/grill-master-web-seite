import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { Button, Card, CardBody, Badge } from "@/components/ui";
import LastOrderHeroButton from "@/components/LastOrderHeroButton";
export default async function Home() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    take: 6,
    orderBy: { createdAt: "desc" },
  });
  const symbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "€";
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-6 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Badge>Online bestellen</Badge>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Lecker. Schnell. Einfach.</h1>
            <p className="text-gray-600">
              Wähle aus dem Menü, bezahle online mit Karte oder vor Ort bei Lieferung/Abholung.
            </p>
          </div>
          <div className="flex gap-2">
            <LastOrderHeroButton />
            <Button href="/menu">Menü öffnen</Button>
            <Button href="/cart" variant="secondary">Zum Warenkorb</Button>
          </div>
        </div>
      </section>
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold">Beliebt</h2>
          <Button href="/menu" variant="secondary">Alle ansehen</Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card key={p.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.imageUrl ? (<img className="h-44 w-full object-cover bg-gray-100" src={p.imageUrl} alt={p.name} />) : (<div className="h-44 w-full rounded-2xl bg-gray-100" />)}
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold">{p.name}</div>
                    <div className="text-sm text-gray-600">{p.description}</div>
                  </div>
                  <div className="shrink-0 font-semibold">{formatMoney(p.priceCents, symbol)}</div>
                </div>
                <div className="mt-4">
                  <Button href="/menu" variant="secondary">Jetzt bestellen</Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
