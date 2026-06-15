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
import { sendTransactionalEmail } from "@/lib/email/send";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" ? s.redirect : undefined }),
});

const phoneOk = (v: string) => /^\d{8,11}$/.test(v.trim());
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function RegisterPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/register" });
  const { signUp } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Vui lòng nhập họ tên";
    if (!emailOk(form.email)) next.email = "Email không đúng định dạng";
    if (!phoneOk(form.phone)) next.phone = "SĐT phải 8 – 11 chữ số";
    if (form.password.length < 6) next.password = "Mật khẩu tối thiểu 6 ký tự";
    setErr(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    const { error } = await signUp(form);
    setBusy(false);
    if (error) {
      toast.error(error.includes("already") ? "Email đã được đăng ký" : error);
      return;
    }
    sendTransactionalEmail({
      templateName: "welcome-signup",
      recipientEmail: form.email,
      idempotencyKey: `welcome-${form.email.toLowerCase()}`,
      templateData: { customerName: form.name, email: form.email },
    }).catch((e: unknown) => console.error("Welcome email failed", e));
    toast.success(`Chào ${form.name}, đăng ký thành công! Email xác nhận đã được gửi.`);
    navigate({ to: (redirect as "/") || "/" });
  }

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card className="p-8">
          <div className="text-center mb-6">
            <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground inline-flex items-center justify-center mb-3"><Plane className="h-6 w-6" /></div>
            <h1 className="text-2xl font-bold font-heading">Đăng ký</h1>
            <p className="text-sm text-muted-foreground mt-1">Tạo tài khoản để bắt đầu hành trình</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label className="mb-2 block">Họ tên</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              {err.name && <p className="text-xs text-destructive mt-1">{err.name}</p>}
            </div>
            <div>
              <Label className="mb-2 block">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              {err.email && <p className="text-xs text-destructive mt-1">{err.email}</p>}
            </div>
            <div>
              <Label className="mb-2 block">Số điện thoại (8–11 số)</Label>
              <Input inputMode="numeric" maxLength={11} value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })} required />
              {err.phone && <p className="text-xs text-destructive mt-1">{err.phone}</p>}
            </div>
            <div>
              <Label className="mb-2 block">Mật khẩu</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              {err.password && <p className="text-xs text-destructive mt-1">{err.password}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Đang xử lý..." : "Tạo tài khoản"}</Button>
          </form>
          <p className="text-sm text-center mt-6 text-muted-foreground">
            Đã có tài khoản? <Link to="/login" search={{ redirect }} className="text-primary font-medium hover:underline">Đăng nhập</Link>
          </p>
        </Card>
      </div>
    </SiteLayout>
  );
}
