"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { Button, Card, CardBody, Badge } from "@/components/ui";

export default function MenuClient({ categories }) {
  const symbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "€";

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Speisekarte</h1>
        <p className="text-sm text-gray-600">Tippe auf ein Gericht, um Extras/Optionen auszuwählen.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700 hover:bg-gray-200"
          >
            {c.name}
          </a>
        ))}
      </div>

      {categories.map((cat) => (
        <section key={cat.id} id={cat.id} className="space-y-4 scroll-mt-24">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-bold">{cat.name}</h2>
              <Badge>{cat.products.length} Artikel</Badge>
            </div>
          </div>

          {cat.products.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              Keine Artikel in dieser Kategorie.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cat.products.map((p) => (
                <Card key={p.id}>
                  <Link href={`/product/${p.id}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.imageUrl ? (<img className="h-44 w-full object-cover bg-gray-100" src={p.imageUrl} alt={p.name} />) : (<div className="h-44 w-full bg-gray-100" />)}
                  </Link>
                  <CardBody>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link href={`/product/${p.id}`} className="font-bold underline">
                          {p.name}
                        </Link>
                        <div className="text-sm text-gray-600">{p.description}</div>
                        {(p.optionGroups?.length || 0) > 0 ? (
                          <div className="mt-2 text-xs text-gray-500">Optionen verfügbar</div>
                        ) : null}
                      </div>
                      <div className="shrink-0 font-semibold">{formatMoney(p.priceCents, symbol)}</div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button href={`/product/${p.id}`}>Auswählen</Button>
                      <Button href="/cart" variant="secondary">Warenkorb</Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
