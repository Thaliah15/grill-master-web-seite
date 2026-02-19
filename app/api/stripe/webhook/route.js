import Stripe from "stripe";
import { prisma } from "/lib/prisma";
import { sendOrderEmail } from "/lib/notify";
import { calcTotals } from "/lib/money";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    const key = process.env.STRIPE_SECRET_KEY;
    if (!secret || !key) {
      return new Response("Missing Stripe env", { status: 400 });
    }

    const stripe = new Stripe(key);

    const sig = req.headers.get("stripe-signature");
    const rawBody = await req.text();

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, secret);
    } catch (err) {
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // ✅ أهم حدث: الدفع اكتمل
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session?.metadata?.orderId;

      if (orderId) {
        const order = await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "PAID",
            status: "CONFIRMED",
            stripePaymentIntentId: session.payment_intent ? String(session.payment_intent) : null,
          },
          include: { items: true },
        });

        // totals للإيميل (إذا notify.js بدو totals)
        const taxRate = Number(process.env.NEXT_PUBLIC_TAX_RATE || "0");
        const itemsForTotals = (order.items || []).map((it) => ({
          unitPriceCents: it.unitPriceCents + (it.extraPriceCents || 0),
          quantity: it.quantity,
        }));
        const totals = calcTotals(itemsForTotals, taxRate);

        const settings = await prisma.settings.findUnique({ where: { id: "main" } });

        try {
          await sendOrderEmail(order, order.items || [], totals, settings || {});
        } catch (e) {
          console.error("EMAIL_NOTIFY_ERROR", e);
        }
      }
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    return new Response(`Server Error: ${e.message}`, { status: 500 });
  }
}
