import { prisma } from "/lib/prisma";
import PrintClient from "./print-client";

export const dynamic = "force-dynamic";

export default async function PrintPage({ params }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) return <div>Bestellung nicht gefunden.</div>;

  return (
    <div className="p-6">
      <PrintClient order={JSON.parse(JSON.stringify(order))} />
    </div>
  );
}
