import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Lock, LockOpen, Search, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAdminUsers, setUserRole, setUserBanned, deleteUser } from "@/lib/users.functions";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

type Row = Awaited<ReturnType<typeof listAdminUsers>>[number];

function AdminUsers() {
  const fetchUsers = useServerFn(listAdminUsers);
  const callSetRole = useServerFn(setUserRole);
  const callSetBanned = useServerFn(setUserBanned);
  const callDelete = useServerFn(deleteUser);

  const [users, setUsers] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchUsers()
      .then((data) => setUsers(data as Row[]))
      .catch((e) => toast.error(e?.message || "Không tải được danh sách"))
      .finally(() => setLoading(false));
  }, [fetchUsers]);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(q.toLowerCase()) || u.email.toLowerCase().includes(q.toLowerCase())
  );

  async function toggleRole(u: Row) {
    const next = u.role === "admin" ? "user" : "admin";
    try {
      await callSetRole({ data: { userId: u.id, role: next } });
      toast.success(`Đã đặt vai trò: ${next}`);
      load();
    } catch (e) { toast.error((e as Error).message); }
  }

  async function toggleBan(u: Row) {
    const banned = !u.banned_until || new Date(u.banned_until) < new Date();
    try {
      await callSetBanned({ data: { userId: u.id, banned } });
      toast.success(banned ? "Đã khoá tài khoản" : "Đã mở khoá");
      load();
    } catch (e) { toast.error((e as Error).message); }
  }

  async function removeUser(u: Row) {
    if (!confirm(`Xoá vĩnh viễn tài khoản ${u.email}?`)) return;
    try {
      await callDelete({ data: { userId: u.id } });
      toast.success("Đã xoá");
      load();
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading">Quản lý người dùng</h1>
        <Button variant="outline" onClick={load} disabled={loading}>Tải lại</Button>
      </div>
      <Card className="p-6">
        <div className="relative max-w-sm mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên/email..." className="pl-9" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead><TableHead>Email</TableHead><TableHead>SĐT</TableHead>
              <TableHead>Vai trò</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (<TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Đang tải...</TableCell></TableRow>)}
            {!loading && filtered.length === 0 && (<TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Chưa có người dùng</TableCell></TableRow>)}
            {filtered.map((u) => {
              const isBanned = !!u.banned_until && new Date(u.banned_until) > new Date();
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phone || "—"}</TableCell>
                  <TableCell><Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge></TableCell>
                  <TableCell><Badge variant={isBanned ? "destructive" : "default"} className={isBanned ? "" : "bg-emerald-500"}>{isBanned ? "Đã khoá" : "Hoạt động"}</Badge></TableCell>
                  <TableCell className="text-right space-x-1">
                    {u.role === "admin" && (
                      <Button variant="ghost" size="icon" title="Hạ quyền" onClick={() => toggleRole(u)}>
                        <ShieldOff className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" title={isBanned ? "Mở khoá" : "Khoá"} onClick={() => toggleBan(u)}>
                      {isBanned ? <LockOpen className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeUser(u)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
