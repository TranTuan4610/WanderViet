import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CrudFormDialog, type FieldDef } from "@/components/admin/CrudFormDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { addHotel, deleteHotel, updateHotel, useAdminVersion } from "@/lib/adminStore";
import { adminGetHotelDetails } from "@/lib/admin.functions";
import { formatVND, hotels, type Hotel } from "@/lib/mockData";
import { listAdminUsers } from "@/lib/users.functions";

export const Route = createFileRoute("/admin/hotels")({ component: AdminHotels });

const fields: FieldDef[] = [
  { key: "name", label: "Tên khách sạn", required: true },
  { key: "city", label: "Thành phố / vị trí", required: true, placeholder: "VD: Đà Nẵng" },
  { key: "address", label: "Địa chỉ chi tiết", required: true },
  { key: "image", label: "Ảnh đại diện (URL)", type: "image", required: true },
  { key: "gallery", label: "Thư viện ảnh (hiện trong chi tiết khách sạn)", type: "images",
    hint: "Mỗi dòng = 1 URL, hoặc bấm 'Tải ảnh từ máy' để thêm" },
  { key: "price", label: "Giá / đêm (VND)", type: "number", required: true },
  { key: "stars", label: "Hạng sao (1-5)", type: "number", required: true },
  { key: "rating", label: "Đánh giá (0-5)", type: "number" },
  { key: "checkIn", label: "Giờ nhận phòng", placeholder: "14:00" },
  { key: "checkOut", label: "Giờ trả phòng", placeholder: "12:00" },
  { key: "description", label: "Mô tả khách sạn", type: "textarea" },
  { key: "roomDescription", label: "Mô tả phòng tiêu chuẩn", type: "textarea" },
];

type HotelDetails = Awaited<ReturnType<typeof adminGetHotelDetails>>;

function AdminHotels() {
  useAdminVersion();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Hotel | null>(null);
  const fetchUsers = useServerFn(listAdminUsers);
  const fetchDetails = useServerFn(adminGetHotelDetails);
  const [owners, setOwners] = useState<Map<string, { name: string; email: string }>>(new Map());
  const [detailHotel, setDetailHotel] = useState<Hotel | null>(null);
  const [details, setDetails] = useState<HotelDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchUsers().then((list) => {
      const m = new Map<string, { name: string; email: string }>();
      (list as Array<{ id: string; name: string; email: string }>).forEach((u) => m.set(u.id, { name: u.name, email: u.email }));
      setOwners(m);
    }).catch(() => { /* ignore */ });
  }, [fetchUsers]);

  const openDetails = async (h: Hotel) => {
    setDetailHotel(h);
    setDetails(null);
    setLoadingDetails(true);
    try {
      const res = await fetchDetails({ data: { hotelId: h.id } });
      setDetails(res);
    } catch (e) {
      toast.error("Không tải được chi tiết khách sạn");
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  };



  const handleSubmit = (v: Record<string, unknown>) => {
    const payload: Partial<Hotel> = {
      name: String(v.name), city: String(v.city), address: String(v.address),
      image: String(v.image), price: Number(v.price), stars: Number(v.stars) || 3,
      rating: Number(v.rating) || 4.5,
      checkIn: String(v.checkIn || "14:00"), checkOut: String(v.checkOut || "12:00"),
      description: String(v.description ?? ""),
      roomDescription: String(v.roomDescription ?? ""),
      gallery: (Array.isArray(v.gallery) ? v.gallery : editing?.gallery ?? []) as string[],
      amenities: editing?.amenities ?? ["Wifi", "Hồ bơi", "Nhà hàng"],
      requirements: editing?.requirements,
      basePeople: editing?.basePeople ?? 2,
      extraFeeRate: editing?.extraFeeRate ?? 0.25,
      rooms: editing?.rooms,
    };
    if (editing) { updateHotel(editing.id, payload); toast.success("Đã cập nhật khách sạn"); }
    else { addHotel(payload as Omit<Hotel, "id">); toast.success("Đã thêm khách sạn mới"); }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading">Quản lý khách sạn</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />Thêm khách sạn</Button>
      </div>
      <Card className="p-6">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Khách sạn</TableHead><TableHead>Thành phố</TableHead><TableHead>Sao</TableHead>
            <TableHead>Giá/đêm</TableHead><TableHead>Đánh giá</TableHead>
            <TableHead>Người đăng</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {hotels.slice(0, 30).map((h) => {
              const owner = h.ownerId ? owners.get(h.ownerId) : undefined;
              const ownerName = owner?.name ?? h.ownerName;
              const ownerEmail = owner?.email ?? h.ownerEmail;
              return (
              <TableRow key={h.id}>
                <TableCell className="font-medium flex items-center gap-3">
                  <img src={h.image} alt="" className="h-10 w-14 rounded object-cover" />
                  <span className="line-clamp-1 max-w-xs">{h.name}</span>
                </TableCell>
                <TableCell>{h.city}</TableCell>
                <TableCell>{"★".repeat(h.stars)}</TableCell>
                <TableCell className="text-primary font-semibold">{formatVND(h.price)}</TableCell>
                <TableCell>⭐ {h.rating}</TableCell>
                <TableCell className="text-xs">
                  {ownerName ? (
                    <div>
                      <div className="font-medium text-foreground">{ownerName}</div>
                      {ownerEmail && <div className="text-muted-foreground">{ownerEmail}</div>}
                    </div>
                  ) : <span className="text-muted-foreground">Hệ thống</span>}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => openDetails(h)} title="Xem chi tiết"><Eye className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(h); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { deleteHotel(h.id); toast.success("Đã xóa"); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground mt-3">Hiển thị 30 khách sạn đầu tiên (tổng: {hotels.length})</p>
      </Card>

      <CrudFormDialog<Hotel>
        open={open} onOpenChange={setOpen}
        title={editing ? "Chỉnh sửa khách sạn" : "Thêm khách sạn mới"}
        fields={fields}
        initial={editing ?? undefined}
        onSubmit={handleSubmit}
      />

      <Dialog open={!!detailHotel} onOpenChange={(o) => { if (!o) { setDetailHotel(null); setDetails(null); } }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết khách sạn — {detailHotel?.name}</DialogTitle>
          </DialogHeader>
          {loadingDetails && <p className="text-sm text-muted-foreground">Đang tải...</p>}
          {details && detailHotel && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="p-3"><div className="text-xs text-muted-foreground">Tổng đặt phòng</div><div className="text-xl font-bold">{details.stats.totalBookings}</div></Card>
                <Card className="p-3"><div className="text-xs text-muted-foreground">Đã thanh toán</div><div className="text-xl font-bold text-primary">{details.stats.paidBookings}</div></Card>
                <Card className="p-3"><div className="text-xs text-muted-foreground">Doanh thu</div><div className="text-xl font-bold">{formatVND(details.stats.revenue)}</div></Card>
                <Card className="p-3"><div className="text-xs text-muted-foreground">Số phòng còn lại</div><div className="text-xl font-bold">{details.stats.totalRooms}</div></Card>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Người tạo / Chủ phòng</h3>
                {details.owner ? (
                  <Card className="p-3 text-sm">
                    <div><span className="text-muted-foreground">Tên:</span> <span className="font-medium">{details.owner.name ?? "—"}</span></div>
                    <div><span className="text-muted-foreground">Email:</span> {details.owner.email ?? "—"}</div>
                    <div><span className="text-muted-foreground">SĐT:</span> {details.owner.phone ?? "—"}</div>
                    <div className="text-xs text-muted-foreground mt-1">ID: {details.owner.id}</div>
                  </Card>
                ) : <p className="text-sm text-muted-foreground">Khách sạn hệ thống (không có chủ phòng cụ thể)</p>}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Danh sách phòng ({details.rooms.length})</h3>
                {details.rooms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có phòng nào trong cơ sở dữ liệu.</p>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Tên phòng</TableHead><TableHead>Giường</TableHead>
                      <TableHead>Sức chứa</TableHead><TableHead>Giá</TableHead>
                      <TableHead>Còn lại</TableHead><TableHead>Loại</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {details.rooms.map((r) => (
                        <TableRow key={String(r.id)}>
                          <TableCell className="font-medium">{String(r.name)}</TableCell>
                          <TableCell>{Number(r.beds)}</TableCell>
                          <TableCell>{Number(r.base_people)}-{Number(r.max_people)}</TableCell>
                          <TableCell>{formatVND(Number(r.base_price))}</TableCell>
                          <TableCell><Badge variant={Number(r.available) > 0 ? "default" : "destructive"}>{Number(r.available ?? 0)}</Badge></TableCell>
                          <TableCell>{r.vip ? "VIP" : "Thường"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Lịch sử đặt phòng ({details.bookings.length})</h3>
                {details.bookings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có đặt phòng nào.</p>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Ngày đặt</TableHead><TableHead>Khách</TableHead>
                      <TableHead>Liên hệ</TableHead><TableHead>Lịch</TableHead>
                      <TableHead>Tổng</TableHead><TableHead>Trạng thái</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {details.bookings.map((b) => {
                        const ci = (b.customer_info ?? {}) as Record<string, unknown>;
                        return (
                          <TableRow key={String(b.id)}>
                            <TableCell className="text-xs">{new Date(String(b.created_at)).toLocaleString("vi-VN")}</TableCell>
                            <TableCell>{String(ci.fullName ?? ci.name ?? "—")}</TableCell>
                            <TableCell className="text-xs">
                              <div>{String(ci.phone ?? "—")}</div>
                              <div className="text-muted-foreground">{String(ci.email ?? "")}</div>
                            </TableCell>
                            <TableCell className="text-xs">
                              {ci.checkIn ? `${String(ci.checkIn)} → ${String(ci.checkOut ?? "")}` : "—"}
                              {ci.guests ? <div className="text-muted-foreground">{String(ci.guests)} khách</div> : null}
                            </TableCell>
                            <TableCell className="font-medium">{formatVND(Number(b.total))}</TableCell>
                            <TableCell><Badge variant={b.status === "paid" ? "default" : "secondary"}>{String(b.status)}</Badge></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
