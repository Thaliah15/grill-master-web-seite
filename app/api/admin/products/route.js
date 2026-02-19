import { prisma } from "/lib/prisma";
import { assertAdmin } from "../_auth";

export async function GET(req) {
  try {
    assertAdmin(req);
    const products = await prisma.product.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: { category: true },
    });
    return Response.json(products);
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 401 });
  }
}

export async function POST(req) {
  try {
    assertAdmin(req);
    const { name, description, priceCents, imageUrl, isActive, categoryId } = await req.json();
    if (!name || String(name).trim().length < 2) throw new Error("Name fehlt.");
    const pc = Number(priceCents);
    if (!Number.isFinite(pc) || pc <= 0) throw new Error("Preis (Cent) ungültig.");

    const created = await prisma.product.create({
      data: {
        name: String(name).trim(),
        description: description ? String(description) : null,
        priceCents: Math.round(pc),
        imageUrl: imageUrl ? String(imageUrl) : null,
        isActive: typeof isActive === "boolean" ? isActive : true,
        categoryId: categoryId || null,
      },
      include: { category: true },
    });
    return Response.json(created);
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 400 });
  }
}

export async function PATCH(req) {
  try {
    assertAdmin(req);
    const { productId, name, description, priceCents, imageUrl, isActive, categoryId } = await req.json();
    if (!productId) throw new Error("productId fehlt.");

    const data = {};
    if (typeof name === "string" && name.trim().length >= 2) data.name = name.trim();
    if (description !== undefined) data.description = description ? String(description) : null;
    if (priceCents !== undefined) {
      const pc = Number(priceCents);
      if (!Number.isFinite(pc) || pc <= 0) throw new Error("Preis (Cent) ungültig.");
      data.priceCents = Math.round(pc);
    }
    if (imageUrl !== undefined) data.imageUrl = imageUrl ? String(imageUrl) : null;
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (categoryId !== undefined) data.categoryId = categoryId || null;

    const updated = await prisma.product.update({
      where: { id: productId },
      data,
      include: { category: true },
    });
    return Response.json(updated);
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 400 });
  }
}

export async function DELETE(req) {
  try {
    assertAdmin(req);
    const { productId } = await req.json();
    if (!productId) throw new Error("productId fehlt.");
    await prisma.product.delete({ where: { id: productId } });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 400 });
  }
}
