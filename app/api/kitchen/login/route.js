import { NextResponse } from "next/server";

export async function POST(req) {
  const { pin } = await req.json().catch(() => ({}));
  if (!pin || pin !== process.env.KITCHEN_PIN) {
    return NextResponse.json({ error: "PIN falsch" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  // cookie لمدة سنة على نفس الجهاز
  res.cookies.set("kitchen_ok", "1", { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}
