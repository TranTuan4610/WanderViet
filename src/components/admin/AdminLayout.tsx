import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { CalendarCheck, Car, LayoutDashboard, Lock, LogOut, Plane, Settings, Tag, Users, Hotel, MapPinned, PlaneTakeoff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

const items = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Người dùng", icon: Users },
  { to: "/admin/tours", label: "Tours", icon: MapPinned },
  { to: "/admin/hotels", label: "Khách sạn", icon: Hotel },
  { to: "/admin/flights", label: "Vé máy bay", icon: PlaneTakeoff },
  { to: "/admin/rentals", label: "Thuê xe", icon: Car },
  { to: "/admin/bookings", label: "Booking", icon: CalendarCheck },
  { to: "/admin/promos", label: "Khuyến mãi", icon: Tag },
];

function AdminPasswordGate() {
  const { user, loading, unlockAdmin } = useAuth();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 text-sm text-muted-foreground">Đang kiểm tra đăng nhập…</div>;
  }
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-primary text-primary-foreground inline-flex items-center justify-center mb-3">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold font-heading">Khu vực quản trị</h1>
          <p className="text-sm text-muted-foreground mt-2 mb-6">Vui lòng đăng nhập tài khoản quản trị trước, sau đó nhập mật khẩu admin.</p>
          <Button className="w-full" asChild><Link to="/login" search={{ redirect: "/admin" }}>Đăng nhập quản trị</Link></Button>
          <Button type="button" variant="outline" className="w-full mt-3" asChild><Link to="/">Về trang chủ</Link></Button>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-primary text-primary-foreground inline-flex items-center justify-center mb-3">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold font-heading">Khu vực quản trị</h1>
          <p className="text-sm text-muted-foreground mt-1">Vui lòng nhập mật khẩu để truy cập</p>
        </div>
        <form onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            if (await unlockAdmin(pw)) toast.success("Mở khoá thành công");
            else { toast.error("Vui lòng đăng nhập và nhập đúng mật khẩu admin"); setPw(""); }
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Không thể mở khoá admin");
          } finally {
            setBusy(false);
          }
        }} className="space-y-4">
          <div>
            <Label className="mb-2 block">Mật khẩu admin</Label>
            <Input type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Đang kiểm tra..." : "Truy cập"}</Button>
          <Button type="button" variant="outline" className="w-full" asChild>
            <Link to="/">Về trang chủ</Link>
          </Button>
        </form>
      </Card>
    </div>
  );
}

export function AdminLayout({ children }: { children?: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { adminUnlocked, lockAdmin } = useAuth();
  const navigate = useNavigate();

  if (!adminUnlocked) return <AdminPasswordGate />;

  return (
    <div className="min-h-screen flex bg-sidebar">
      <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col sticky top-0 h-screen">
        <Link to="/" className="flex items-center gap-2 px-6 h-16 border-b border-sidebar-border">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><Plane className="h-5 w-5" /></span>
          <span className="font-heading font-bold">WanderViet</span>
        </Link>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {items.map((it) => {
            const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
              >
                <it.icon className="h-4 w-4" />{it.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-sidebar-accent"><Settings className="h-4 w-4" />Về website</Link>
          <button
            onClick={() => { lockAdmin(); toast.success("Đã thoát khu vực admin"); navigate({ to: "/" }); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-sidebar-accent text-left"
          ><LogOut className="h-4 w-4" />Khoá / Đăng xuất</button>
        </div>
      </aside>
      <div className="flex-1 bg-background">
        <header className="h-16 border-b flex items-center px-6 sticky top-0 bg-background z-30">
          <div className="font-heading font-semibold">Admin Dashboard</div>
        </header>
        <div className="p-6">{children ?? <Outlet />}</div>
      </div>
    </div>
  );
}
