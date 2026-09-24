import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/admin/session";

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  if (verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  const login = new URL("/admin/login", request.url);
  if (pathname !== "/admin") login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
