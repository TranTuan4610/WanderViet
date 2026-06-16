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
import { addHotel, deleteHotel, refreshHotelsFromDb, updateHotel, useAdminVersion } from "@/lib/adminStore";
import { adminDeleteRoom, adminGetHotelDetails, adminUpsertRoom } from "@/lib/admin.functions";
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
  { key: "amenities", label: "Tiện nghi khách sạn", type: "list", placeholder: "Wifi\nHồ bơi\nNhà hàng" },
  { key: "requirements", label: "Quy định / yêu cầu", type: "list", placeholder: "Không hút thuốc\nXuất trình CCCD khi nhận phòng" },
  { key: "basePeople", label: "Số khách mặc định/phòng", type: "number" },
  { key: "extraFeeRate", label: "Phụ thu khách dư (0.25 = 25%)", type: "number" },
  { key: "ownerId", label: "ID chủ sở hữu (profiles.id)", placeholder: "UUID của chủ khách sạn" },
];

const roomFields: FieldDef[] = [
  { key: "name", label: "Tên phòng", required: true, placeholder: "Standard Double" },
  { key: "room_type", label: "Loại phòng", placeholder: "standard / deluxe / vip" },
  { key: "image", label: "Ảnh phòng (URL)", type: "image" },
  { key: "beds", label: "Số giường", type: "number" },
  { key: "bed_type", label: "Kiểu giường", placeholder: "1 giường Queen" },
  { key: "base_people", label: "Số khách tính trong giá", type: "number" },
  { key: "capacity", label: "Sức chứa tối đa", type: "number" },
  { key: "base_price", label: "Giá phòng / đêm", type: "number", required: true },
  { key: "available", label: "Số phòng còn", type: "number" },
  { key: "owner_email", label: "Email chủ phòng", placeholder: "owner@email.com" },
  { key: "amenities", label: "Tiện nghi phòng", type: "list", placeholder: "Wifi\nMáy lạnh\nTV" },
  { key: "description", label: "Mô tả phòng", type: "textarea" },
];

type HotelDetails = Awaited<ReturnType<typeof adminGetHotelDetails>>;

function AdminHotels() {
  useAdminVersion();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Hotel | null>(null);
  const fetchUsers = useServerFn(listAdminUsers);
  const fetchDetails = useServerFn(adminGetHotelDetails);
  const saveRoom = useServerFn(adminUpsertRoom);
  const removeRoom = useServerFn(adminDeleteRoom);
  const [owners, setOwners] = useState<Map<string, { name: string; email: string }>>(new Map());
  const [detailHotel, setDetailHotel] = useState<Hotel | null>(null);
  const [details, setDetails] = useState<HotelDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [roomOpen, setRoomOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Record<string, unknown> | null>(null);

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



  const handleSubmit = async (v: Record<string, unknown>) => {
    const payload: Partial<Hotel> = {
      name: String(v.name), city: String(v.city), address: String(v.address || v.city),
      image: String(v.image), price: Number(v.price), stars: Number(v.stars) || 3,
      rating: Number(v.rating) || 4.5,
      checkIn: String(v.checkIn || "14:00"), checkOut: String(v.checkOut || "12:00"),
      description: String(v.description ?? ""),
      roomDescription: String(v.roomDescription ?? ""),
      gallery: (Array.isArray(v.gallery) ? v.gallery : editing?.gallery ?? []) as string[],
      amenities: (Array.isArray(v.amenities) ? v.amenities : editing?.amenities ?? ["Wifi", "Hồ bơi", "Nhà hàng"]) as string[],
      requirements: (Array.isArray(v.requirements) ? v.requirements : editing?.requirements ?? []) as string[],
      basePeople: Number(v.basePeople) || editing?.basePeople || 2,
      extraFeeRate: Number(v.extraFeeRate) || editing?.extraFeeRate || 0.25,
      ownerId: v.ownerId ? String(v.ownerId).trim() : editing?.ownerId,
      rooms: editing?.rooms,
    };
    try {
      if (editing) {
        await updateHotel(editing.id, payload);
        toast.success("Đã cập nhật khách sạn và đồng bộ Supabase");
      } else {
        await addHotel(payload as Omit<Hotel, "id">);
        toast.success("Đã thêm khách sạn mới vào Supabase");
      }
    } catch (e) {
      toast.error((e as Error).message || "Không lưu được khách sạn");
      throw e;
    }
  };

  const handleRoomSubmit = async (v: Record<string, unknown>) => {
    if (!detailHotel) return;
    const roomType = String(v.room_type || editingRoom?.room_type || "standard").toLowerCase();
    const capacity = Number(v.capacity || v.max_people || 2);
    const basePeople = Number(v.base_people || 2);
    const basePrice = Number(v.base_price || 0);
    const values = {
      name: String(v.name),
      room_type: roomType,
      vip: roomType === "vip",
      image: v.image ? String(v.image) : null,
      beds: Number(v.beds || 1),
      bed_type: String(v.bed_type || ""),
      base_people: basePeople,
      max_people: capacity,
      capacity,
      base_price: basePrice,
      price_multiplier: detailHotel.price > 0 && basePrice > 0 ? basePrice / detailHotel.price : 1,
      available: Number(v.available || 0),
      owner_email: v.owner_email ? String(v.owner_email) : null,
      amenities: Array.isArray(v.amenities) ? v.amenities : [],
      description: String(v.description ?? ""),
    };
    try {
      await saveRoom({ data: { hotelId: detailHotel.id, roomId: editingRoom?.id ? String(editingRoom.id) : null, values } });
      await refreshHotelsFromDb();
      const res = await fetchDetails({ data: { hotelId: detailHotel.id } });
      setDetails(res);
      toast.success(editingRoom ? "Đã cập nhật phòng" : "Đã thêm phòng");
    } catch (e) {
      toast.error((e as Error).message || "Không lưu được phòng");
      throw e;
    }
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
                  <Button variant="ghost" size="icon" onClick={async () => {
                    try {
                      await deleteHotel(h.id);
                      toast.success("Đã xóa khách sạn khỏi Supabase");
                    } catch (e) {
                      toast.error((e as Error).message || "Không xóa được khách sạn");
                    }
                  }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="font-semibold">Danh sách phòng ({details.rooms.length})</h3>
                  <Button size="sm" onClick={() => { setEditingRoom(null); setRoomOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1" />Thêm phòng
                  </Button>
                </div>
                {details.rooms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có phòng nào trong cơ sở dữ liệu.</p>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Tên phòng</TableHead><TableHead>Giường</TableHead>
                      <TableHead>Sức chứa</TableHead><TableHead>Giá</TableHead>
                      <TableHead>Còn lại</TableHead><TableHead>Loại</TableHead><TableHead>Owner email</TableHead><TableHead className="text-right">Hành động</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {details.rooms.map((r) => {
                        const roomType = String(r.room_type ?? (r.vip ? "vip" : "standard"));
                        const capacity = Number(r.capacity ?? r.max_people ?? 0);
                        return (
                          <TableRow key={String(r.id)}>
                            <TableCell className="font-medium">{String(r.name)}</TableCell>
                            <TableCell>{Number(r.beds)} · {String(r.bed_type ?? "")}</TableCell>
                            <TableCell>{Number(r.base_people)}-{capacity}</TableCell>
                            <TableCell>{formatVND(Number(r.base_price))}</TableCell>
                            <TableCell><Badge variant={Number(r.available) > 0 ? "default" : "destructive"}>{Number(r.available ?? 0)}</Badge></TableCell>
                            <TableCell>{roomType}</TableCell>
                            <TableCell className="text-xs">{String(r.owner_email ?? "—")}</TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="ghost" size="icon" onClick={() => { setEditingRoom(r as Record<string, unknown>); setRoomOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={async () => {
                                try {
                                  await removeRoom({ data: { roomId: String(r.id) } });
                                  await refreshHotelsFromDb();
                                  const res = await fetchDetails({ data: { hotelId: detailHotel.id } });
                                  setDetails(res);
                                  toast.success("Đã xóa phòng");
                                } catch (e) {
                                  toast.error((e as Error).message || "Không xóa được phòng");
                                }
                              }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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

      <CrudFormDialog<Record<string, unknown>>
        open={roomOpen}
        onOpenChange={setRoomOpen}
        title={editingRoom ? "Chỉnh sửa phòng" : "Thêm phòng"}
        fields={roomFields}
        initial={editingRoom ?? undefined}
        onSubmit={handleRoomSubmit}
      />
    </>
  );
}
