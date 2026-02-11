import { prisma } from "@/lib/prisma";
import { assertAdmin } from "../_auth";

export async function GET(req) {
  try {
    assertAdmin(req);
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return Response.json(categories);
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 401 });
  }
}

export async function POST(req) {
  try {
    assertAdmin(req);
    const { name, sortOrder } = await req.json();
    if (!name || String(name).trim().length < 2) throw new Error("Name fehlt.");
    const so = Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0;

    const created = await prisma.category.create({
      data: { name: String(name).trim(), sortOrder: so },
    });
    return Response.json(created);
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 400 });
  }
}

export async function PATCH(req) {
  try {
    assertAdmin(req);
    const { categoryId, name, sortOrder } = await req.json();
    if (!categoryId) throw new Error("categoryId fehlt.");
    const data = {};
    if (typeof name === "string" && name.trim().length >= 2) data.name = name.trim();
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data,
    });
    return Response.json(updated);
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 400 });
  }
}

export async function DELETE(req) {
  try {
    assertAdmin(req);
    const { categoryId } = await req.json();
    if (!categoryId) throw new Error("categoryId fehlt.");

    const cat = await prisma.category.findUnique({
      where: { id: categoryId },
      include: { _count: { select: { products: true } } },
    });
    if (!cat) throw new Error("Kategorie nicht gefunden.");
    if (cat._count.products > 0) throw new Error("Kategorie hat Produkte. Erst Produkte entfernen/verschieben.");

    await prisma.category.delete({ where: { id: categoryId } });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 400 });
  }
}
