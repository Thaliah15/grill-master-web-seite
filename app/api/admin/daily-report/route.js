import { prisma } from "/lib/prisma";
import { assertAdmin } from "../_auth";

export async function GET(req) {
  assertAdmin(req);

  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: start, lte: end },
      // إذا بدك تستثني الملغاة:
      // status: { not: "CANCELED" },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, totalCents: true },
  });

  const count = orders.length;
  const totalCents = orders.reduce((a, o) => a + Number(o.totalCents || 0), 0);
  const ids = orders.map((o) => o.id);

  return Response.json({ date: start.toISOString(), count, totalCents, ids });
}
