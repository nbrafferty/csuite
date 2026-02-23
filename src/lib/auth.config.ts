import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Lightweight auth config for middleware (no Prisma imports).
 * The actual authorize() logic lives in auth.ts — this config only needs
 * enough info for NextAuth to verify JWT tokens in Edge middleware.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    // Credentials provider stub — authorize is overridden in auth.ts
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email!;
        const u = user as unknown as Record<string, unknown>;
        token.firstName = u.firstName as string;
        token.lastName = u.lastName as string;
        token.role = u.role as string;
        token.companyId = u.companyId as string;
        token.companyName = u.companyName as string;
        token.companySlug = u.companySlug as string;
      }
      return token;
    },
    async session({ session, token }) {
      Object.assign(session.user, {
        id: token.id as string,
        email: token.email as string,
        firstName: token.firstName as string,
        lastName: token.lastName as string,
        role: token.role as string,
        companyId: token.companyId as string,
        companyName: token.companyName as string,
        companySlug: token.companySlug as string,
      });
      return session;
    },
  },
};
