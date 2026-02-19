import { prisma } from "/lib/prisma";
import { assertAdmin } from "../_auth";

export async function GET(req) {
  try {
    assertAdmin(req);

    const url = new URL(req.url);
    const range = url.searchParams.get("range") || "all";

    const now = new Date();
    let where = {};

    if (range === "today") {
            const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      where = { createdAt: { gte: start, lte: end } };
    }

    if (range === "7d") {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      where = { createdAt: { gte: start } };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        items: true, // ✅ هذا المهم
      },
    });

    return Response.json(orders);
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 401 });
  }
}


export async function PATCH(req) {
  try {
    assertAdmin(req);
    const { orderId, status } = await req.json();
    if (!orderId || !status) throw new Error("Missing fields");
    await prisma.order.update({ where: { id: orderId }, data: { status }});
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 400 });
  }
}
