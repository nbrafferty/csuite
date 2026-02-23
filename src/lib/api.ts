import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { UserRole } from "@/generated/prisma";
import type { Action } from "@/lib/permissions";
import { can } from "@/lib/permissions";

export type AuthenticatedUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId: string;
  companyName: string;
  companySlug: string;
};

/**
 * Get the authenticated user from the session.
 * Returns null if not authenticated.
 */
export async function getAuthUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user as AuthenticatedUser;
}

/**
 * Require authentication. Returns the user or a 401 response.
 */
export async function requireAuth(): Promise<
  | { user: AuthenticatedUser; error?: never }
  | { user?: never; error: NextResponse }
> {
  const user = await getAuthUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user };
}

/**
 * Require a specific permission. Returns the user or an error response.
 */
export async function requirePermission(action: Action): Promise<
  | { user: AuthenticatedUser; error?: never }
  | { user?: never; error: NextResponse }
> {
  const result = await requireAuth();
  if (result.error) return result;

  if (!can(result.user.role, action)) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { user: result.user };
}

/**
 * Build a tenant-scoped where clause.
 * CCC Staff can optionally access all tenants.
 */
export function tenantWhere(
  user: AuthenticatedUser,
  overrideCompanyId?: string
): { companyId: string } {
  // CCC Staff can access any tenant if explicitly specified
  if (user.role === UserRole.CCC_STAFF && overrideCompanyId) {
    return { companyId: overrideCompanyId };
  }
  return { companyId: user.companyId };
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
