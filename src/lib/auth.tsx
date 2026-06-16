import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AuthUser = {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  phone?: string;
  role?: "admin" | "user";
  status?: "active" | "inactive" | "banned";
  avatarUrl?: string;
};

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  signUp: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  adminUnlocked: boolean;
  unlockAdmin: (password: string) => boolean;
  lockAdmin: () => void;
};

const ADMIN_PASSWORD = "123456789";
const SS_ADMIN = "wv_admin_unlocked";

const Ctx = createContext<AuthCtx | null>(null);

async function hydrateUser(userId: string, email: string, meta?: Record<string, unknown>): Promise<AuthUser> {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("email, name, full_name, phone, role, status, avatar_url")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);
  const role = profile?.role === "admin" || roles?.some((r) => r.role === "admin") ? "admin" : "user";
  const metaName = typeof meta?.name === "string" ? (meta.name as string) : undefined;
  const metaFullName = typeof meta?.full_name === "string" ? (meta.full_name as string) : undefined;
  const metaPhone = typeof meta?.phone === "string" ? (meta.phone as string) : undefined;
  const resolvedEmail = profile?.email || email;
  const resolvedName = profile?.name || profile?.full_name || metaName || metaFullName || resolvedEmail.split("@")[0];
  return {
    id: userId,
    email: resolvedEmail,
    name: resolvedName,
    fullName: profile?.full_name || resolvedName,
    phone: profile?.phone || metaPhone || undefined,
    avatarUrl: profile?.avatar_url || undefined,
    status: (profile?.status as AuthUser["status"] | null) || "active",
    role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  useEffect(() => {
    try { if (sessionStorage.getItem(SS_ADMIN) === "1") setAdminUnlocked(true); } catch { /* ignore */ }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setTimeout(() => {
          hydrateUser(session.user.id, session.user.email || "", session.user.user_metadata).then(setUser).catch(() => {
            const metaName = (session.user.user_metadata as { name?: string } | null)?.name;
            setUser({ id: session.user.id, email: session.user.email || "", name: metaName || session.user.email?.split("@")[0] || "User" });
          });
        }, 0);
      } else {
        setUser(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        hydrateUser(session.user.id, session.user.email || "", session.user.user_metadata).then(setUser).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp: AuthCtx["signUp"] = async ({ name, email, phone, password }) => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        data: { name, full_name: name, phone },
      },
    });
    if (error) return { error: error.message };
    return {};
  };

  const signIn: AuthCtx["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setUser(null); return; }
    const u = await hydrateUser(session.user.id, session.user.email || "", session.user.user_metadata);
    setUser(u);
  };

  const unlockAdmin = (pw: string) => {
    const ok = pw === ADMIN_PASSWORD;
    if (ok) {
      setAdminUnlocked(true);
      try { sessionStorage.setItem(SS_ADMIN, "1"); } catch { /* ignore */ }
    }
    return ok;
  };
  const lockAdmin = () => {
    setAdminUnlocked(false);
    try { sessionStorage.removeItem(SS_ADMIN); } catch { /* ignore */ }
  };

  return <Ctx.Provider value={{ user, loading, signUp, signIn, logout, refreshUser, adminUnlocked, unlockAdmin, lockAdmin }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
