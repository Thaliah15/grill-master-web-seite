import { assertAdmin } from "../_auth";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function extFromType(type) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return null;
}

export async function POST(req) {
  try {
    assertAdmin(req);

    const form = await req.formData();
    const file = form.get("file");
    if (!file) return Response.json({ error: "Keine Datei." }, { status: 400 });

    const type = file.type || "";
    if (!ALLOWED.has(type)) {
      return Response.json({ error: "Nur JPG/PNG/WEBP erlaubt." }, { status: 400 });
    }

    const ext = extFromType(type);
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) {
      return Response.json({ error: "Datei zu groß (max 5MB)." }, { status: 400 });
    }

    const name = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
    const outDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(path.join(outDir, name), buf);

    return Response.json({ url: `/uploads/${name}` });
  } catch (e) {
    return Response.json({ error: e.message }, { status: e.status || 401 });
  }
}
