import { prisma } from "/lib/prisma";
import { assertAdmin } from "../_auth";

export async function GET(req) {
  try {
    assertAdmin(req);
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
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 401 });
  }
}

export async function PATCH(req) {
  try {
    assertAdmin(req);
    const body = await req.json();
    const data = {};
    if (body.openTime) data.openTime = String(body.openTime);
    if (body.closeTime) data.closeTime = String(body.closeTime);
    if (body.minOrderCents !== undefined) data.minOrderCents = Number(body.minOrderCents);
    if (body.deliveryFeeCents !== undefined) data.deliveryFeeCents = Number(body.deliveryFeeCents);
    if (body.enablePickup !== undefined) data.enablePickup = !!body.enablePickup;
    if (body.enableDelivery !== undefined) data.enableDelivery = !!body.enableDelivery;

if (body.notifyEmailTo !== undefined) data.notifyEmailTo = body.notifyEmailTo ? String(body.notifyEmailTo) : null;
if (body.notifyEmailFrom !== undefined) data.notifyEmailFrom = body.notifyEmailFrom ? String(body.notifyEmailFrom) : null;
if (body.whatsappTo !== undefined) data.whatsappTo = body.whatsappTo ? String(body.whatsappTo) : null;
if (body.whatsappEnabled !== undefined) data.whatsappEnabled = !!body.whatsappEnabled;


    const s = await prisma.settings.upsert({
      where: { id: "main" },
      update: data,
      create: { id: "main", ...data },
    });
    return Response.json(s);
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 400 });
  }
}
