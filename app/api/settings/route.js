import { prisma } from "@/lib/prisma";

export async function GET() {
  const s = await prisma.settings.upsert({
    where: { id: "main" },
    update: {},
    create: {
          id: "main",
          openTime: "11:00",
          closeTime: "22:00",
          minOrderCents: 0,
          deliveryFeeCents: 0,
          enablePickup: true,
          enableDelivery: true,
          notifyEmailTo: null,
          notifyEmailFrom: null,
          whatsappTo: null,
          whatsappEnabled: false,
        },
  });
  return Response.json(s);
}
