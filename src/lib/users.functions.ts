import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
import { explainSupabaseError } from "@/lib/adminErrors";

type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  full_name: string;
  phone: string;
  role: "admin" | "user";
  status: "active" | "inactive" | "banned";
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  banned_until: string | null;
};

export const listAdminUsers = createServerFn({ method: "GET" }).handler(async (): Promise<AdminUserRow[]> => {
  const [{ data: profiles, error: pErr }, { data: roles, error: rErr }, authRes] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, email, name, full_name, phone, role, status, avatar_url, created_at, updated_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("user_roles").select("user_id, role"),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  if (pErr) throw new Error(explainSupabaseError(pErr, "Không tải được profiles"));
  if (rErr) throw new Error(explainSupabaseError(rErr, "Không tải được user_roles"));
  if (authRes.error) throw new Error(explainSupabaseError(authRes.error, "Không tải được auth.users"));

  const rolesByUser = new Map<string, string[]>();
  (roles ?? []).forEach((r) => {
    const arr = rolesByUser.get(r.user_id) ?? [];
    arr.push(r.role);
    rolesByUser.set(r.user_id, arr);
  });

  const authById = new Map(authRes.data.users.map((u) => [u.id, u]));
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Main source is public.profiles. auth.users is only used as a fallback for banned_until
  // and as a safety net until the backfill migration has been applied.
  const ids = new Set<string>([...profileById.keys(), ...authById.keys()]);

  return Array.from(ids).map((id) => {
    const p = profileById.get(id);
    const au = authById.get(id);
    const authEmail = au?.email ?? "";
    const email = p?.email || authEmail;
    const userRoles = rolesByUser.get(id) ?? [];
    const role = (p?.role === "admin" || userRoles.includes("admin")) ? "admin" : "user";
    const bannedUntil = (au as { banned_until?: string | null } | undefined)?.banned_until ?? null;
    const isBanned = !!bannedUntil && new Date(bannedUntil) > new Date();
    const status = isBanned ? "banned" : ((p?.status as AdminUserRow["status"] | null) ?? "active");
    const name = p?.name || p?.full_name || email.split("@")[0] || "User";

    return {
      id,
      email,
      name,
      full_name: p?.full_name || name,
      phone: p?.phone ?? "",
      role,
      status,
      avatar_url: p?.avatar_url ?? null,
      created_at: p?.created_at ?? au?.created_at ?? new Date().toISOString(),
      updated_at: p?.updated_at ?? p?.created_at ?? au?.created_at ?? new Date().toISOString(),
      banned_until: bannedUntil,
    };
  }).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
});

export const setUserRole = createServerFn({ method: "POST" })
  .inputValidator((d: { userId: string; role: "admin" | "user" }) =>
    z.object({ userId: z.string().uuid(), role: z.enum(["admin", "user"]) }).parse(d))
  .handler(async ({ data }) => {
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    if (roleError) throw new Error(explainSupabaseError(roleError, "Không cập nhật user_roles"));

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ role: data.role, updated_at: new Date().toISOString() })
      .eq("id", data.userId);
    if (profileError) throw new Error(explainSupabaseError(profileError, "Không cập nhật profiles"));

    return { ok: true };
  });

export const setUserBanned = createServerFn({ method: "POST" })
  .inputValidator((d: { userId: string; banned: boolean }) =>
    z.object({ userId: z.string().uuid(), banned: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.banned ? "876000h" : "none",
    });
    if (authError) throw new Error(explainSupabaseError(authError, "Không cập nhật auth.users"));

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ status: data.banned ? "banned" : "active", updated_at: new Date().toISOString() })
      .eq("id", data.userId);
    if (profileError) throw new Error(explainSupabaseError(profileError, "Không cập nhật trạng thái profiles"));

    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .inputValidator((d: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(explainSupabaseError(error, "Không xóa auth.users"));
    return { ok: true };
  });
