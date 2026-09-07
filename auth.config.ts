import type { NextAuthConfig } from "next-auth";

// Edge-safe config used by middleware (no Prisma / bcrypt here).
export const authConfig = {
  // Vercel deployments (production + preview URLs) don't have a single
  // fixed origin, so trust the incoming request host instead of requiring
  // NEXTAUTH_URL to match exactly.
  trustHost: true,
  pages: {
    signIn: "/",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname === "/";

      if (isLoginPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
