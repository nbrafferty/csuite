import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/server/db/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.error("[auth] Missing email or password");
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
            include: { company: true },
          });

          if (!user) {
            console.error("[auth] No user found for email:", credentials.email);
            return null;
          }

          if (user.status === "DISABLED") {
            console.error("[auth] User is disabled:", credentials.email);
            return null;
          }

          const isValid = await compare(
            credentials.password as string,
            user.passwordHash
          );
          if (!isValid) {
            console.error("[auth] Invalid password for:", credentials.email);
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: user.companyId,
            companyName: user.company.name,
            companySlug: user.company.slug,
          };
        } catch (error) {
          console.error("[auth] Authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = (user as any).role;
        token.companyId = (user as any).companyId;
        token.companyName = (user as any).companyName;
        token.companySlug = (user as any).companySlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).companyId = token.companyId;
        (session.user as any).companyName = token.companyName;
        (session.user as any).companySlug = token.companySlug;
      }
      return session;
    },
  },
});
