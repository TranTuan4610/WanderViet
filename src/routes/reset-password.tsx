import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plane } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const tokenHash = url.searchParams.get("token_hash") || url.hash.match(/token_hash=([^&]+)/)?.[1];
    const type = url.searchParams.get("type") || url.hash.match(/type=([^&]+)/)?.[1];
    const accessToken = url.hash.match(/access_token=([^&]+)/)?.[1];
    const refreshToken = url.hash.match(/refresh_token=([^&]+)/)?.[1];

    (async () => {
      if (accessToken) {
        if (refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: decodeURIComponent(accessToken),
            refresh_token: decodeURIComponent(refreshToken),
          });
          if (error) toast.error("Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
          setValidLink(!error);
        } else {
          setValidLink(true);
        }
        setReady(true);
        return;
      }
      if (tokenHash && type === "recovery") {
        const { error } = await supabase.auth.verifyOtp({ token_hash: decodeURIComponent(tokenHash), type: "recovery" });
        if (error) toast.error("Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
        setValidLink(!error);
        setReady(true);
        return;
      }
      setReady(true);
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { toast.error("Mật khẩu tối thiểu 6 ký tự"); return; }
    if (password !== confirm) { toast.error("Mật khẩu xác nhận không khớp"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Đã cập nhật mật khẩu mới");
    navigate({ to: "/login" });
  }

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card className="p-8">
          <div className="text-center mb-6">
            <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground inline-flex items-center justify-center mb-3"><Plane className="h-6 w-6" /></div>
            <h1 className="text-2xl font-bold font-heading">Đặt lại mật khẩu</h1>
            <p className="text-sm text-muted-foreground mt-1">Cập nhật mật khẩu mới cho tài khoản WanderViet</p>
          </div>

          {!ready ? (
            <p className="text-sm text-muted-foreground text-center">Đang kiểm tra link...</p>
          ) : !validLink ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
              <Button className="w-full" onClick={() => navigate({ to: "/login" })}>Quay lại đăng nhập</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label className="mb-2 block">Mật khẩu mới</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div>
                <Label className="mb-2 block">Nhập lại mật khẩu mới</Label>
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? "Đang cập nhật..." : "Cập nhật mật khẩu"}</Button>
            </form>
          )}
        </Card>
      </div>
    </SiteLayout>
  );
}