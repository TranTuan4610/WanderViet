import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { Plane } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" ? s.redirect : undefined }),
});

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<{ email?: string; password?: string }>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof err = {};
    if (!emailOk(email)) next.email = "Email không đúng định dạng";
    if (password.length < 6) next.password = "Mật khẩu tối thiểu 6 ký tự";
    setErr(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    const { error } = await signIn(email, password);
    setBusy(false);
    if (error) {
      toast.error(error.includes("Invalid") ? "Email hoặc mật khẩu không đúng" : error);
      return;
    }
    toast.success("Đăng nhập thành công");
    navigate({ to: (redirect as "/") || "/" });
  }

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card className="p-8">
          <div className="text-center mb-6">
            <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground inline-flex items-center justify-center mb-3"><Plane className="h-6 w-6" /></div>
            <h1 className="text-2xl font-bold font-heading">Đăng nhập</h1>
            <p className="text-sm text-muted-foreground mt-1">Chào mừng quay lại WanderViet</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="mb-2 block">Email</Label>
              <Input type="email" placeholder="ban@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              {err.email && <p className="text-xs text-destructive mt-1">{err.email}</p>}
            </div>
            <div>
              <Label className="mb-2 block">Mật khẩu</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              {err.password && <p className="text-xs text-destructive mt-1">{err.password}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Đang xử lý..." : "Đăng nhập"}</Button>
          </form>
          <p className="text-sm text-center mt-6 text-muted-foreground">
            Chưa có tài khoản? <Link to="/register" search={{ redirect }} className="text-primary font-medium hover:underline">Đăng ký</Link>
          </p>
        </Card>
      </div>
    </SiteLayout>
  );
}
