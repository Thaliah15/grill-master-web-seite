import { prisma } from "@/lib/prisma";
import MenuClient from "./ui";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { isActive: true },
        orderBy: [{ createdAt: "desc" }],
        include: {
          optionGroups: {
            include: {
              group: {
                include: {
                  items: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
                },
              },
            },
          },
        },
      },
    },
  });

  return <MenuClient categories={categories} />;
}
