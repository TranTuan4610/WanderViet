import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plane, Hotel as HotelIcon, MapPin, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { formatVND } from "@/lib/mockData";
import { adminListBookings, adminUpdateBookingStatus } from "@/lib/admin.functions";


export const Route = createFileRoute("/admin/bookings")({ component: AdminBookings });

type BookingRow = {
  id: string;
  type: "tour" | "hotel" | "flight" | string;
  ref_id: string;
  ref_title: string | null;
  total: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  user_id: string | null;
  customer_info: Record<string, unknown> | null;
};

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-emerald-500",
  pending: "bg-amber-500",
  cancelled: "bg-red-500",
  refunded: "bg-slate-500",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  tour: <MapPin className="h-4 w-4" />,
  hotel: <HotelIcon className="h-4 w-4" />,
  flight: <Plane className="h-4 w-4" />,
};

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleString("vi-VN"); } catch { return iso; }
}

function AdminBookings() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const callList = useServerFn(adminListBookings);
  const callUpdate = useServerFn(adminUpdateBookingStatus);

  const load = async () => {
    setLoading(true);
    try {
      const data = await callList();
      setRows((data ?? []) as BookingRow[]);
    } catch (e) {
      toast.error("Không tải được danh sách booking: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await callUpdate({ data: { id, status: status as "pending" | "paid" | "cancelled" | "refunded" } });
      toast.success(`Đã cập nhật trạng thái → ${status}`);
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch (e) {
      toast.error("Cập nhật thất bại: " + (e as Error).message);
    }
  };


  const filtered = rows.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const info = (r.customer_info ?? {}) as Record<string, unknown>;
      const name = (info.name as string | undefined)?.toLowerCase() ?? "";
      const phone = (info.phone as string | undefined)?.toLowerCase() ?? "";
      const title = (r.ref_title ?? "").toLowerCase();
      if (!name.includes(q) && !phone.includes(q) && !title.includes(q) && !r.id.includes(q)) return false;
    }
    return true;
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold font-heading">Quản lý booking</h1>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Tải lại
        </Button>
      </div>

      <Card className="p-4 mb-4 flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Tìm theo mã, khách, SĐT, tiêu đề..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            <SelectItem value="tour">Tour</SelectItem>
            <SelectItem value="hotel">Khách sạn</SelectItem>
            <SelectItem value="flight">Vé máy bay</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="pending">Chờ thanh toán</SelectItem>
            <SelectItem value="paid">Đã thanh toán</SelectItem>
            <SelectItem value="cancelled">Đã hủy</SelectItem>
            <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length} / {rows.length} booking
        </span>
      </Card>

      <Card className="p-2 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Khách</TableHead>
              <TableHead>Nội dung</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Thanh toán</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Đang tải...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Chưa có booking nào</TableCell></TableRow>
            ) : filtered.map((b) => {
              const info = (b.customer_info ?? {}) as Record<string, unknown>;
              return (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 capitalize text-sm">
                      {TYPE_ICONS[b.type]} {b.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{(info.name as string) || "—"}</div>
                      <div className="text-xs text-muted-foreground">{(info.phone as string) || ""}</div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{b.ref_title || b.ref_id}</TableCell>
                  <TableCell className="text-primary font-semibold">{formatVND(b.total)}</TableCell>
                  <TableCell className="text-xs uppercase">{b.payment_method || "—"}</TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[b.status] || "bg-slate-500"}>{b.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{fmtDate(b.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Select value={b.status} onValueChange={(v) => updateStatus(b.id, v)}>
                      <SelectTrigger className="w-36 h-8 text-xs ml-auto"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Chờ thanh toán</SelectItem>
                        <SelectItem value="paid">Đã thanh toán</SelectItem>
                        <SelectItem value="cancelled">Đã hủy</SelectItem>
                        <SelectItem value="refunded">Đã hoàn tiền</SelectItem>
                      </SelectContent>
                    </Select>
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
