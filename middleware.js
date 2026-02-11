import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // ✅ لا تلمس الـ API أبداً (حتى ما يصير Redirect ويفشل JSON بالتطبيق)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ✅ اسمح بصفحة تسجيل الدخول
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // ✅ حماية صفحات الويب فقط: /admin و /kitchen
  if (pathname.startsWith("/admin") || pathname.startsWith("/kitchen")) {
    const token = req.cookies.get("admin_token")?.value;
    const expected = process.env.ADMIN_TOKEN;

    if (!token || token !== expected) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/kitchen/:path*"],
};
