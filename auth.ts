import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        employeeNumber: { label: "社員番号", type: "text" },
        password: { label: "パスワード", type: "password" },
      },
      authorize: async (credentials) => {
        const employeeNumber = credentials?.employeeNumber;
        const password = credentials?.password;
        if (typeof employeeNumber !== "string" || typeof password !== "string") {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { employeeNumber } });
        if (!user) return null;

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          employeeNumber: user.employeeNumber,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.employeeNumber = user.employeeNumber as string;
        token.role = user.role as string;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.employeeNumber = token.employeeNumber as string;
        session.user.role = token.role as string;

        // Re-checked on every request (rather than baked into the JWT) so
        // that changing the password takes effect immediately, without
        // needing a separate client-side session refresh trigger.
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { mustChangePassword: true, campusId: true },
        });
        session.user.mustChangePassword = dbUser?.mustChangePassword ?? false;
        session.user.campusId = dbUser?.campusId ?? null;
      }
      return session;
    },
  },
});
