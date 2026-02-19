import { prisma } from "/lib/prisma";
import { assertAdmin } from "../../_auth";

export async function GET(req, { params }) {
  assertAdmin(req);
  const { id } = params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(order);
}
