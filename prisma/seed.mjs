import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureSettings() {
  // Settings row (singleton)
  const existing = await prisma.settings.findUnique({ where: { id: "main" } }).catch(() => null);
  if (!existing) {
    await prisma.settings.create({
      data: {
        id: "main",
        openTime: "11:00",
        closeTime: "22:00",
        minOrderCents: 1500,
        deliveryFeeCents: 300,
        enablePickup: true,
        enableDelivery: true,
        notifyEmailTo: process.env.NOTIFY_EMAIL_TO || null,
        notifyEmailFrom: process.env.NOTIFY_EMAIL_FROM || null,
        whatsappTo: null,
        whatsappEnabled: false,
      },
    });
  }
}

async function ensureCategoriesAndProducts() {
  const existing = await prisma.product.count();
  if (existing > 0) return;

  const categories = [
    { name: "Vorspeisen", sortOrder: 1 },
    { name: "Pizza", sortOrder: 2 },
    { name: "Burger", sortOrder: 3 },
    { name: "Salate", sortOrder: 4 },
    { name: "Getränke", sortOrder: 5 },
    { name: "Desserts", sortOrder: 6 },
  ];

  await prisma.category.createMany({ data: categories });
  const cats = await prisma.category.findMany();
  const catByName = new Map(cats.map((c) => [c.name, c.id]));

  await prisma.product.createMany({
    data: [
      {
        name: "Bruschetta",
        description: "Geröstetes Brot, Tomaten, Basilikum",
        priceCents: 590,
        imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=60",
        categoryId: catByName.get("Vorspeisen"),
      },
      {
        name: "Margherita Pizza",
        description: "Tomate, Mozzarella, Basilikum",
        priceCents: 990,
        imageUrl: "https://images.unsplash.com/photo-1548365328-9f547f5a0f6b?auto=format&fit=crop&w=1200&q=60",
        categoryId: catByName.get("Pizza"),
      },
      {
        name: "BBQ Burger",
        description: "Rind, Cheddar, BBQ-Sauce, Zwiebeln",
        priceCents: 1190,
        imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=60",
        categoryId: catByName.get("Burger"),
      },
      {
        name: "Caesar Salat",
        description: "Römersalat, Croutons, Parmesan",
        priceCents: 890,
        imageUrl: "https://images.unsplash.com/photo-1551892374-ecf8754cf8f0?auto=format&fit=crop&w=1200&q=60",
        categoryId: catByName.get("Salate"),
      },
      {
        name: "Cola 0,33l",
        description: "Kalt serviert",
        priceCents: 290,
        imageUrl: "https://images.unsplash.com/photo-1622480916115-35019eaaf4aa?auto=format&fit=crop&w=1200&q=60",
        categoryId: catByName.get("Getränke"),
      },
      {
        name: "Tiramisu",
        description: "Hausgemacht",
        priceCents: 550,
        imageUrl: "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?auto=format&fit=crop&w=1200&q=60",
        categoryId: catByName.get("Desserts"),
      },
    ],
  });
}

async function ensureExtras() {
  // Create option groups + items (only once)
  const count = await prisma.optionGroup.count().catch(() => 0);
  if (count > 0) return;

  const extraCheese = await prisma.optionGroup.create({
    data: {
      name: "Pizza Extras",
      type: "MULTIPLE",
      required: false,
      maxSelect: 0,
      sortOrder: 1,
      items: {
        create: [
          { name: "Extra Käse", priceCents: 100, sortOrder: 1 },
          { name: "Oliven", priceCents: 100, sortOrder: 2 },
          { name: "Pilze", priceCents: 100, sortOrder: 3 },
          { name: "Scharfe Salami", priceCents: 150, sortOrder: 4 },
        ],
      },
    },
    include: { items: true },
  });

  const pizzaSize = await prisma.optionGroup.create({
    data: {
      name: "Pizza Größe",
      type: "SINGLE",
      required: true,
      maxSelect: 1,
      sortOrder: 2,
      items: {
        create: [
          { name: "Normal", priceCents: 0, sortOrder: 1 },
          { name: "Groß", priceCents: 300, sortOrder: 2 },
        ],
      },
    },
    include: { items: true },
  });

  const burgerExtras = await prisma.optionGroup.create({
    data: {
      name: "Burger Extras",
      type: "MULTIPLE",
      required: false,
      maxSelect: 0,
      sortOrder: 1,
      items: {
        create: [
          { name: "Bacon", priceCents: 150, sortOrder: 1 },
          { name: "Extra Patty", priceCents: 300, sortOrder: 2 },
          { name: "Extra Sauce", priceCents: 50, sortOrder: 3 },
        ],
      },
    },
    include: { items: true },
  });

  // Link groups to products in Pizza/Burger categories
  const pizzaProducts = await prisma.product.findMany({ where: { category: { name: "Pizza" } } });
  const burgerProducts = await prisma.product.findMany({ where: { category: { name: "Burger" } } });

  for (const p of pizzaProducts) {
    await prisma.productOptionGroup.createMany({
      data: [
        { productId: p.id, groupId: extraCheese.id },
        { productId: p.id, groupId: pizzaSize.id },
      ],
      skipDuplicates: true,
    });
  }
  for (const p of burgerProducts) {
    await prisma.productOptionGroup.createMany({
      data: [{ productId: p.id, groupId: burgerExtras.id }],
      skipDuplicates: true,
    });
  }
}

async function main() {
  await ensureSettings();
  await ensureCategoriesAndProducts();
  await ensureExtras();
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
