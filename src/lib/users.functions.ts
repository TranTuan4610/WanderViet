import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listAdminUsers = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: profiles, error: pErr }, { data: roles, error: rErr }, authRes] = await Promise.all([
    supabaseAdmin.from("profiles").select("id, name, phone, created_at"),
    supabaseAdmin.from("user_roles").select("user_id, role"),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  if (pErr) throw new Error(pErr.message);
  if (rErr) throw new Error(rErr.message);
  if (authRes.error) throw new Error(authRes.error.message);

  const rolesByUser = new Map<string, string[]>();
  (roles ?? []).forEach((r) => {
    const arr = rolesByUser.get(r.user_id) ?? [];
    arr.push(r.role);
    rolesByUser.set(r.user_id, arr);
  });
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return authRes.data.users.map((u) => {
    const p = profileById.get(u.id);
    const userRoles = rolesByUser.get(u.id) ?? [];
    return {
      id: u.id,
      email: u.email ?? "",
      name: p?.name ?? (u.email?.split("@")[0] ?? ""),
      phone: p?.phone ?? "",
      role: userRoles.includes("admin") ? "admin" : "user",
      created_at: u.created_at,
      banned_until: (u as { banned_until?: string | null }).banned_until ?? null,
    };
  });
});

export const setUserRole = createServerFn({ method: "POST" })
  .inputValidator((d: { userId: string; role: "admin" | "user" }) =>
    z.object({ userId: z.string().uuid(), role: z.enum(["admin", "user"]) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setUserBanned = createServerFn({ method: "POST" })
  .inputValidator((d: { userId: string; banned: boolean }) =>
    z.object({ userId: z.string().uuid(), banned: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.banned ? "876000h" : "none",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .inputValidator((d: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
