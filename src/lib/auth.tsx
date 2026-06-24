import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { claimAdminAccess } from "@/lib/admin-auth.functions";

export type AuthUser = { id: string; name: string; email: string; phone?: string; role?: "admin" | "user"; avatarUrl?: string };

type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  signUp: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  adminUnlocked: boolean;
  unlockAdmin: (password: string) => Promise<boolean>;
  lockAdmin: () => void;
};

const SS_ADMIN = "wv_admin_unlocked";

const Ctx = createContext<AuthCtx | null>(null);

async function hydrateUser(userId: string, email: string, meta?: Record<string, unknown>): Promise<AuthUser> {
  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("name, phone, avatar_url").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);
  const role = roles?.some((r) => r.role === "admin") ? "admin" : "user";
  const metaName = typeof meta?.name === "string" ? (meta.name as string) : undefined;
  const metaPhone = typeof meta?.phone === "string" ? (meta.phone as string) : undefined;
  return {
    id: userId,
    email,
    name: profile?.name || metaName || email.split("@")[0],
    phone: profile?.phone || metaPhone || undefined,
    avatarUrl: profile?.avatar_url || undefined,
    role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const claimAdmin = useServerFn(claimAdminAccess);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminUnlocked, setAdminUnlocked] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setTimeout(() => {
          hydrateUser(session.user.id, session.user.email || "", session.user.user_metadata).then((u) => {
            setUser(u);
            try { setAdminUnlocked(sessionStorage.getItem(SS_ADMIN) === "1" && u.role === "admin"); } catch { /* ignore */ }
          }).catch(() => {
            const metaName = (session.user.user_metadata as { name?: string } | null)?.name;
            setUser({ id: session.user.id, email: session.user.email || "", name: metaName || session.user.email?.split("@")[0] || "User" });
            setAdminUnlocked(false);
          });
        }, 0);
      } else {
        setUser(null);
        setAdminUnlocked(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        hydrateUser(session.user.id, session.user.email || "", session.user.user_metadata).then((u) => {
          setUser(u);
          try { setAdminUnlocked(sessionStorage.getItem(SS_ADMIN) === "1" && u.role === "admin"); } catch { /* ignore */ }
        }).finally(() => setLoading(false));
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
        data: { name, phone },
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

  const unlockAdmin = async (pw: string) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Bạn cần đăng nhập trước khi mở khoá admin");
    const res = await claimAdmin({ data: { password: pw } });
    if (!res.ok) {
      if (res.reason === "wrong_password") throw new Error("Sai mật khẩu admin");
      return false;
    }
    setAdminUnlocked(true);
    try { sessionStorage.setItem(SS_ADMIN, "1"); } catch { /* ignore */ }
    await refreshUser();
    return true;
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
