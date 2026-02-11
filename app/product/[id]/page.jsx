import { prisma } from "@/lib/prisma";
import ProductClient from "./ui";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      optionGroups: {
        include: {
          group: {
            include: { items: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
          },
        },
      },
    },
  });

  if (!product) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
        Produkt nicht gefunden.
      </div>
    );
  }

  return <ProductClient product={product} />;
}
