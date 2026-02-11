export function assertAdmin(req) {
  const headerToken = req.headers.get("x-admin-token");

  // cookie fallback
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)admin_token=([^;]+)/);
  const cookieToken = m ? decodeURIComponent(m[1]) : "";

  const token = headerToken || cookieToken;
  const expected = process.env.ADMIN_TOKEN;

  if (!token || token !== expected) {
    // ✅ أهم شي: ما تعمل redirect هون
    throw Object.assign(new Error("UNAUTHORIZED"), { status: 401 });
  }
}
