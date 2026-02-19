import { prisma } from "/lib/prisma";
import { sendOrderEmail } from "/lib/notify";
import { calcTotals } from "/lib/money";
import { isOpenNow } from "/lib/settings";
import { z } from "zod";
import Stripe from "stripe";

const ItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});

const BodySchema = z.object({
  items: z.array(ItemSchema).min(1),
  customerName: z.string().min(1),
  phone: z.string().min(5),
  address: z.string().optional().default(""),
  notes: z.string().optional(),
  paymentMethod: z.enum(["ONLINE", "COD"]),
  fulfillmentMethod: z.enum(["DELIVERY", "PICKUP"]),
});

function methodLabel(method) {
  return method === "DELIVERY" ? "Lieferung" : "Abholung";
}

export async function POST(req) {
  try {
    const json = await req.json();
    const body = BodySchema.parse(json);

    const fulfillmentMethod =
      String(body.fulfillmentMethod || "").toUpperCase() === "DELIVERY" ? "DELIVERY" : "PICKUP";

    // Settings defaults
    const settings = await prisma.settings.upsert({
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

    // Hours / allowed
    if (!isOpenNow(settings)) {
      return Response.json(
        { error: `Wir sind aktuell geschlossen. Öffnungszeiten: ${settings.openTime} – ${settings.closeTime}` },
        { status: 400 }
      );
    }
    if (fulfillmentMethod === "PICKUP" && !settings.enablePickup) {
      return Response.json({ error: "Abholung ist aktuell nicht verfügbar." }, { status: 400 });
    }
    if (fulfillmentMethod === "DELIVERY" && !settings.enableDelivery) {
      return Response.json({ error: "Lieferung ist aktuell nicht verfügbar." }, { status: 400 });
    }

    // Products + prices
    const ids = body.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: ids }, isActive: true },
    });
    const map = new Map(products.map((p) => [p.id, p]));

    const cleanItems = body.items.map((i) => {
      const p = map.get(i.productId);
      if (!p) throw new Error("Ungültiges Produkt im Warenkorb.");
      return {
        productId: p.id,
        nameSnapshot: p.name,
        quantity: i.quantity,
        unitPriceCents: p.priceCents,
        lineTotalCents: p.priceCents * i.quantity,
      };
    });

    const taxRate = Number(process.env.NEXT_PUBLIC_TAX_RATE || "0");
    const totals = calcTotals(
      cleanItems.map((i) => ({ unitPriceCents: i.unitPriceCents, quantity: i.quantity })),
      taxRate
    );

    // Min order
    if (totals.subtotalCents < Number(settings.minOrderCents || 0)) {
      return Response.json(
        { error: `Mindestbestellwert: ${(settings.minOrderCents / 100).toFixed(2)} €` },
        { status: 400 }
      );
    }

    const deliveryFeeCents = fulfillmentMethod === "DELIVERY" ? Number(settings.deliveryFeeCents || 0) : 0;
    const totalWithDelivery = totals.totalCents + deliveryFeeCents;

    const addressValue = fulfillmentMethod === "PICKUP" ? "Abholung" : (body.address || "");
    if (fulfillmentMethod === "DELIVERY" && addressValue.trim().length < 5) {
      return Response.json({ error: "Bitte Adresse für Lieferung angeben." }, { status: 400 });
    }

    // ✅ CREATE ORDER
    const order = await prisma.order.create({
      data: {
        paymentMethod: body.paymentMethod,
        paymentStatus: body.paymentMethod === "ONLINE" ? "PENDING" : "UNPAID",
        status: "PENDING",
        fulfillmentMethod,
        deliveryFeeCents,
        customerName: body.customerName,
        phone: body.phone,
        address: addressValue,
        notes: body.notes || null,
        subtotalCents: totals.subtotalCents,
        taxCents: totals.taxCents,
        totalCents: totalWithDelivery,
        currency: process.env.NEXT_PUBLIC_CURRENCY || "EUR",
        items: { create: cleanItems },
      },
      include: { items: true },
    });

    // ✅ COD: confirm مباشرة + ايميل
    if (body.paymentMethod === "COD") {
      try {
        await sendOrderEmail(order, order.items || [], totals, settings);
      } catch (e) {
        console.error("EMAIL_NOTIFY_ERROR", e);
      }

      await prisma.order.update({ where: { id: order.id }, data: { status: "CONFIRMED" } });
      return Response.json({ orderId: order.id, method: methodLabel(fulfillmentMethod) });
    }

    // ✅ ONLINE: Stripe checkout
    if (!process.env.STRIPE_SECRET_KEY) {
      return Response.json({ error: "Stripe ist nicht konfiguriert (STRIPE_SECRET_KEY fehlt)." }, { status: 400 });
    }

    // مهم: لازم يكون عندك BASE_URL مثل https://grillmaster.de
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL;
    if (!baseUrl) {
      return Response.json({ error: "BASE_URL fehlt. Setze NEXT_PUBLIC_BASE_URL أو BASE_URL." }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const line_items = [
      ...cleanItems.map((i) => ({
        quantity: i.quantity,
        price_data: {
          currency: (process.env.NEXT_PUBLIC_CURRENCY || "EUR").toLowerCase(),
          product_data: { name: i.nameSnapshot },
          unit_amount: i.unitPriceCents,
        },
      })),
      ...(deliveryFeeCents > 0
        ? [{
            quantity: 1,
            price_data: {
              currency: (process.env.NEXT_PUBLIC_CURRENCY || "EUR").toLowerCase(),
              product_data: { name: "Liefergebühr" },
              unit_amount: deliveryFeeCents,
            },
          }]
        : []),
    ];

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${baseUrl}/order/${order.id}?paid=1`,
      cancel_url: `${baseUrl}/checkout?canceled=1`,
      customer_creation: "if_required",
      metadata: { orderId: order.id },
      line_items,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    // ⚠️ لا تبعت ايميل هون (لسا مو مدفوع)
    // الإيميل بعد الدفع رح يجي من Webhook
    return Response.json({ redirectUrl: session.url, orderId: order.id, method: methodLabel(fulfillmentMethod) });

  } catch (e) {
    return Response.json({ error: e.message || "Fehler" }, { status: 400 });
  }
}
