import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const claimAdminAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ password: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const envPw = process.env.ADMIN_ACCESS_PASSWORD?.trim();
    const adminPassword = envPw && envPw.length > 0 ? envPw : "123456789";
    const provided = data.password.trim();
    if (provided !== adminPassword) {
      console.warn("[claimAdminAccess] password mismatch", {
        userId: context.userId,
        providedLen: provided.length,
        expectedLen: adminPassword.length,
        usingEnv: Boolean(envPw),
      });
      return { ok: false, reason: "wrong_password" as const };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" })
      .select("id")
      .maybeSingle();

    if (error && error.code !== "23505") {
      console.error("[claimAdminAccess] insert failed", error);
      throw new Error(error.message);
    }

    return { ok: true, reason: "granted" as const };
  });
