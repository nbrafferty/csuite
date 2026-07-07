import { auth } from "@/server/auth/auth";
import { type TRPCContext } from "./trpc";

export async function createTRPCContext(): Promise<TRPCContext> {
  const session = await auth();
  return { session };
}
