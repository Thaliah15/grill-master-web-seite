
import nodemailer from "nodemailer";
import twilio from "twilio";

function env(k) {
  return process.env[k] && String(process.env[k]).trim();
}

function isDelivery(order) {
  // ✅ مصدر الحقيقة عندك هو fulfillmentMethod (DELIVERY/PICKUP)
  return String(order?.fulfillmentMethod || "").trim().toUpperCase() === "DELIVERY";
}

export function isEmailConfigured(settings) {
  const to = settings?.notifyEmailTo || env("NOTIFY_EMAIL_TO");
  return !!(env("SMTP_HOST") && env("SMTP_PORT") && env("SMTP_USER") && env("SMTP_PASS") && to);
}

export function isWhatsappConfigured(settings) {
  const enabled = settings?.whatsappEnabled;
  const to = settings?.whatsappTo;
  return !!(enabled && to && env("TWILIO_ACCOUNT_SID") && env("TWILIO_AUTH_TOKEN") && env("TWILIO_WHATSAPP_FROM"));
}

export async function sendOrderEmail(order, items, totals, settings) {
  const to = settings?.notifyEmailTo || env("NOTIFY_EMAIL_TO");
  const from = settings?.notifyEmailFrom || env("NOTIFY_EMAIL_FROM") || env("SMTP_USER");
  if (!isEmailConfigured(settings)) return { ok: false, skipped: true, reason: "email_not_configured" };

  const transporter = nodemailer.createTransport({
    host: env("SMTP_HOST"),
    port: Number(env("SMTP_PORT")),
    secure: env("SMTP_SECURE") === "true",
    auth: { user: env("SMTP_USER"), pass: env("SMTP_PASS") },
  });

  const lines = items
    .map((it) => {
      const opt = it.selectedOptionsJson ? JSON.parse(it.selectedOptionsJson) : null;
      const optText = opt?.length
        ? "\n  " + opt.map((g) => `${g.groupName}: ${(g.items || []).map((x) => x.name).join(", ")}`).join("\n  ")
        : "";
      const unit = (it.unitPriceCents + (it.extraPriceCents || 0)) / 100;
      return `• ${it.quantity}× ${it.nameSnapshot} (${unit.toFixed(2)} €)${optText}`;
    })
    .join("\n");

  const delivery = isDelivery(order);
  const methodLabel = delivery ? "Lieferung" : "Abholung";

  const subject = `Neue Bestellung (${methodLabel}) #${order.id.slice(-6)}`;
  const body =
    `🍽️ Neue Bestellung : #${order.id.slice(-6)}\n\n` +
    `Typ: ${methodLabel}\n\n` +
    `Kunde: ${order.customerName}\n\n` +
    `Telefon: ${order.phone || "-"}\n\n` + // ✅ كان customerPhone
    (delivery ? `Adresse: ${order.address}\n\n` : `Abholung\n\n`) + // ✅ address عندك
    `Zahlung: ${order.paymentMethod}/${order.paymentStatus}\n\n` +
    `Status: ${order.status}\n\n` +
    `Notitz: ${order.notes || "-"}\n\n` +
    `Artikel:\n${lines}\n\n` +
    `Summe: ${(totals.totalCents / 100).toFixed(2)} €\n`;

  await transporter.sendMail({ from, to, subject, text: body });
  return { ok: true };
}

export async function sendOrderWhatsapp(order, items, totals, settings) {
  // (أنت قلت ما بدك واتساب — خليه موجود بس ما رح يشتغل إذا whatsappEnabled=false)
  if (!isWhatsappConfigured(settings)) return { ok: false, skipped: true, reason: "whatsapp_not_configured" };

  const client = twilio(env("TWILIO_ACCOUNT_SID"), env("TWILIO_AUTH_TOKEN"));
  const to = "whatsapp:" + String(settings.whatsappTo).trim().replace(/^whatsapp:/, "");

  const lines = items
    .map((it) => {
      const opt = it.selectedOptionsJson ? JSON.parse(it.selectedOptionsJson) : null;
      const optText = opt?.length
        ? " | " + opt.map((g) => `${g.groupName}: ${(g.items || []).map((x) => x.name).join(", ")}`).join(" ; ")
        : "";
      return `${it.quantity}x ${it.nameSnapshot}${optText}`;
    })
    .join("\n");

  const delivery = isDelivery(order);
  const methodLabel = delivery ? "Lieferung" : "Abholung";

  const msg =
    `🍽️ Neue Bestellung #${order.id.slice(-6)}\n` +
    `Typ: ${methodLabel}\n` +
    `Kunde: ${order.customerName}\n` +
    `Tel: ${order.phone || "-"}\n` +
    (delivery ? `Adresse: ${order.address}\n` : `Abholung\n`) +
    `Total: ${(totals.totalCents / 100).toFixed(2)} €\n\n` +
    `Artikel:\n${lines}\n`;

  await client.messages.create({
    from: env("TWILIO_WHATSAPP_FROM"),
    to,
    body: msg,
  });

  return { ok: true };
}
