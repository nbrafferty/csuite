import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      companyId: string;
      companyName: string;
      companySlug: string;
    };
  }

  interface User {
    role: UserRole;
    companyId: string;
    companyName: string;
    companySlug: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    companyId: string;
    companyName: string;
    companySlug: string;
  }
}
