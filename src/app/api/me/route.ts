import { requireAuth, jsonOk } from "@/lib/api";
import { db } from "@/lib/db";

export async function GET() {
  const result = await requireAuth();
  if (result.error) return result.error;

  const { user } = result;

  const fullUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
        },
      },
    },
  });

  if (!fullUser) {
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
    });
  }

  return jsonOk(fullUser);
}
