import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextResponse } from "next/server";

const { auth: middleware } = NextAuth(authConfig);

const PUBLIC_ROUTES = ["/login", "/api/auth"];
const AUTH_ONLY_ROUTES = ["/api/"]; // API routes: just need auth, no role check

const ROLE_ROUTES: Record<string, string[]> = {
  GERENCIA: ["*"],
  ADMINISTRADOR: [
    "/dashboard",
    "/clientes",
    "/servicios",
    "/finanzas",
    "/cobranzas",
    "/incidencias",
    "/libros",
    "/prospectos",
    "/reportes",
  ],
  CONTADOR: [
    "/dashboard",
    "/clientes",
    "/servicios",
    "/cobranzas",
    "/incidencias",
    "/libros",
  ],
  VENTAS: ["/dashboard", "/prospectos"],
};

export default middleware((req) => {
  const { pathname } = req.nextUrl;

  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // API routes: authenticated = allowed (role checks inside the handler)
  if (AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const role = (req.auth.user as any)?.role as string;
  const allowedRoutes = ROLE_ROUTES[role];

  if (!allowedRoutes) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (allowedRoutes[0] === "*") return NextResponse.next();

  const isAllowed = allowedRoutes.some((route) => pathname.startsWith(route));
  if (!isAllowed) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
