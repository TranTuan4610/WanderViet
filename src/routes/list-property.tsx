import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, CalendarDays, ImagePlus, LogIn, Mail, Phone, Plus, Trash2, Users } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { addHotel } from "@/lib/adminStore";
import { supabase } from "@/integrations/supabase/client";
import { formatVND } from "@/lib/mockData";
import { toast } from "sonner";

export const Route = createFileRoute("/list-property")({
  component: ListPropertyPage,
});

type OwnerHotel = { id: string; name: string; city: string; image: string | null };
type OwnerBooking = {
  id: string;
  ref_id: string;
  ref_title: string | null;
  total: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  customer_info: Record<string, any> | null;
};

type RoomDraft = {
  name: string;
  tier: "standard" | "deluxe" | "vip";
  beds: number;
  bedType: string;
  basePeople: number;
  maxPeople: number;
  priceMultiplier: number;
  available: number;
  description: string;
};

const emptyRoom = (): RoomDraft => ({
  name: "Phòng Tiêu chuẩn", tier: "standard", beds: 1, bedType: "1 giường đôi",
  basePeople: 2, maxPeople: 3, priceMultiplier: 1, available: 5, description: "",
});

function ListPropertyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [stars, setStars] = useState(3);
  const [price, setPrice] = useState(1_000_000);
  const [description, setDescription] = useState("");
  const [amenities, setAmenities] = useState("Wifi, Hồ bơi, Nhà hàng");
  const [image, setImage] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [rooms, setRooms] = useState<RoomDraft[]>([emptyRoom()]);
  const [submitting, setSubmitting] = useState(false);

  // Owner dashboard data
  const [myHotels, setMyHotels] = useState<OwnerHotel[]>([]);
  const [myBookings, setMyBookings] = useState<OwnerBooking[]>([]);
  const [loadingDash, setLoadingDash] = useState(false);
  const [dashVersion, setDashVersion] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoadingDash(true);
    (async () => {
      try {
        const { data: hs } = await supabase
          .from("hotels")
          .select("id, name, city, image")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false });
        if (cancelled) return;
        const hotelsList = (hs ?? []) as OwnerHotel[];
        setMyHotels(hotelsList);
        if (hotelsList.length === 0) {
          setMyBookings([]);
        } else {
          const ids = hotelsList.map((h) => h.id);
          const { data: bs } = await supabase
            .from("bookings")
            .select("id, ref_id, ref_title, total, status, payment_method, created_at, customer_info")
            .eq("type", "hotel")
            .in("ref_id", ids)
            .order("created_at", { ascending: false });
          if (!cancelled) setMyBookings((bs ?? []) as OwnerBooking[]);
        }
      } finally {
        if (!cancelled) setLoadingDash(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, dashVersion]);


  if (!user) {
    return (
      <SiteLayout>
        <section className="container mx-auto px-4 py-20">
          <Card className="max-w-xl mx-auto p-8 text-center space-y-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
              <Building2 className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold">Đăng chỗ nghỉ của bạn</h1>
            <p className="text-muted-foreground">
              Bạn cần đăng nhập hoặc đăng ký tài khoản chủ chỗ nghỉ để có thể đăng thông tin khách sạn, phòng và ảnh.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <Button asChild><Link to="/login" search={{ redirect: "/list-property" }}><LogIn className="h-4 w-4 mr-2" />Đăng nhập</Link></Button>
              <Button variant="outline" asChild><Link to="/register" search={{ redirect: "/list-property" }}>Đăng ký</Link></Button>
            </div>
          </Card>
        </section>
      </SiteLayout>
    );
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) { toast.error("Ảnh tối đa 4MB"); return; }
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result || ""));
    reader.readAsDataURL(f);
  }

  async function handleGalleryFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    const reads: Promise<string>[] = [];
    for (const f of Array.from(files)) {
      if (f.size > 4 * 1024 * 1024) { toast.error(`Bỏ qua ${f.name} (>4MB)`); continue; }
      reads.push(new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result || ""));
        r.onerror = rej;
        r.readAsDataURL(f);
      }));
    }
    const urls = (await Promise.all(reads)).filter(Boolean);
    setGallery((g) => [...g, ...urls]);
    e.target.value = "";
  }

  function updateRoom(i: number, patch: Partial<RoomDraft>) {
    setRooms((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function submit() {
    if (!user) return;
    if (!name || !city || !address || !image || price <= 0) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc & tải ảnh");
      return;
    }
    setSubmitting(true);
    try {
      await addHotel({
        name, address, city, price, rating: 4.5, stars, image,
        gallery,
        amenities: amenities.split(",").map((s) => s.trim()).filter(Boolean),
        description,
        checkIn: "14:00", checkOut: "12:00",
        ownerId: user.id,
        ownerName: user.name,
        ownerEmail: user.email,
        rooms: rooms.map((r, i) => ({
          id: `r-new-${Date.now()}-${i}`,
          name: r.name, tier: r.tier, beds: r.beds, bedType: r.bedType,
          basePeople: r.basePeople, maxPeople: r.maxPeople,
          priceMultiplier: r.priceMultiplier, available: r.available,
          description: r.description,
        })),
      });
      toast.success("Đã đăng chỗ nghỉ thành công!");
      navigate({ to: "/hotels" });
    } catch (e) {
      toast.error("Có lỗi khi đăng. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SiteLayout>
      <section className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-primary text-sm font-medium mb-2">
            <Building2 className="h-4 w-4" /> Dành cho chủ chỗ nghỉ
          </div>
          <h1 className="text-3xl font-bold">Đăng chỗ nghỉ của bạn</h1>
          <p className="text-muted-foreground mt-1">
            Điền thông tin khách sạn, các loại phòng, giá và tải ảnh để bắt đầu đón khách.
          </p>
        </div>

        {/* Owner dashboard: hotels + bookings */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">Chỗ nghỉ của bạn</h2>
              <p className="text-sm text-muted-foreground">
                Theo dõi các phòng đã đăng, lượt đặt và thông tin khách hàng.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setDashVersion((v) => v + 1)}>
              Làm mới
            </Button>
          </div>

          {loadingDash ? (
            <p className="text-sm text-muted-foreground">Đang tải dữ liệu…</p>
          ) : myHotels.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Bạn chưa có chỗ nghỉ nào. Hãy đăng chỗ nghỉ đầu tiên bằng biểu mẫu bên dưới.
            </p>
          ) : (
            <div className="space-y-6">
              {myHotels.map((h) => {
                const bs = myBookings.filter((b) => b.ref_id === h.id);
                const paid = bs.filter((b) => b.status === "paid");
                const revenue = paid.reduce((s, b) => s + Number(b.total ?? 0), 0);
                return (
                  <div key={h.id} className="rounded-lg border p-4">
                    <div className="flex flex-wrap gap-4 items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {h.image && (
                          <img src={h.image} alt={h.name} className="h-14 w-20 rounded-md object-cover border" />
                        )}
                        <div>
                          <div className="font-semibold">{h.name}</div>
                          <div className="text-xs text-muted-foreground">{h.city}</div>
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <Badge variant="secondary">{bs.length} lượt đặt</Badge>
                        <Badge>{paid.length} đã thanh toán</Badge>
                        <Badge variant="outline">{formatVND(revenue)} doanh thu</Badge>
                      </div>
                    </div>

                    {bs.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Chưa có lượt đặt nào.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="text-xs text-muted-foreground border-b">
                            <tr className="text-left">
                              <th className="py-2 pr-2">Mã đơn</th>
                              <th className="py-2 pr-2">Khách hàng</th>
                              <th className="py-2 pr-2">Lịch / Số khách</th>
                              <th className="py-2 pr-2">Ngày đặt</th>
                              <th className="py-2 pr-2">Tổng</th>
                              <th className="py-2 pr-2">Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bs.map((b) => {
                              const ci = (b.customer_info ?? {}) as Record<string, any>;
                              const sched: string[] = [];
                              if (ci.checkIn && ci.checkOut) sched.push(`${ci.checkIn} → ${ci.checkOut}`);
                              else if (ci.date) sched.push(ci.date);
                              if (ci.people) sched.push(`${ci.people} khách`);
                              if (ci.rooms) sched.push(`${ci.rooms} phòng`);
                              const created = new Date(b.created_at);
                              return (
                                <tr key={b.id} className="border-b last:border-0 align-top">
                                  <td className="py-2 pr-2 font-mono text-xs">#{b.id.slice(0, 8).toUpperCase()}</td>
                                  <td className="py-2 pr-2">
                                    <div className="font-medium">{ci.name || "—"}</div>
                                    <div className="text-xs text-muted-foreground flex flex-col gap-0.5 mt-0.5">
                                      {ci.phone && (
                                        <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{ci.phone}</span>
                                      )}
                                      {ci.email && (
                                        <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{ci.email}</span>
                                      )}
                                      {ci.cccd && (
                                        <span className="text-[11px]">CCCD: {ci.cccd}</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-2 pr-2 text-xs">
                                    <div className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{sched.join(" · ") || "—"}</div>
                                    {ci.roomName && <div className="text-muted-foreground mt-0.5">{ci.roomName}</div>}
                                  </td>
                                  <td className="py-2 pr-2 text-xs whitespace-nowrap">
                                    <div className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{created.toLocaleDateString("vi-VN")}</div>
                                    <div className="text-muted-foreground">{created.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</div>
                                  </td>
                                  <td className="py-2 pr-2 font-semibold whitespace-nowrap">{formatVND(Number(b.total ?? 0))}</td>
                                  <td className="py-2 pr-2">
                                    <Badge variant={b.status === "paid" ? "default" : "secondary"} className="text-xs">
                                      {b.status === "paid" ? "Đã thanh toán" : b.status}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>


        <Card className="p-6 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Tên chỗ nghỉ *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Sunrise Boutique Hotel" />
            </div>
            <div>
              <Label>Thành phố *</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="VD: Đà Nẵng" />
            </div>
            <div className="sm:col-span-2">
              <Label>Địa chỉ chi tiết *</Label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Số nhà, đường, phường/quận" />
            </div>
            <div>
              <Label>Hạng sao</Label>
              <Select value={String(stars)} onValueChange={(v) => setStars(+v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((s) => <SelectItem key={s} value={String(s)}>{s} sao</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Giá cơ bản / đêm (VND) *</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(+e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Tiện ích (phân cách bằng dấu phẩy)</Label>
              <Input value={amenities} onChange={(e) => setAmenities(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Mô tả chi tiết</Label>
              <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả về chỗ nghỉ, vị trí, dịch vụ nổi bật..." />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Ảnh chỗ nghỉ *</Label>
            <div className="flex items-center gap-4">
              <label className="flex h-32 w-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-accent/30 transition">
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground mt-1">Tải ảnh bìa</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
              </label>
              {image && <img src={image} alt="preview" className="h-32 w-48 rounded-lg object-cover border" />}
            </div>
            <p className="text-xs text-muted-foreground mt-2">JPG/PNG, tối đa 4MB.</p>
          </div>

          <div>
            <Label className="mb-2 block">Thư viện ảnh thêm (hiện trong chi tiết khách sạn)</Label>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-accent/30 transition">
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground mt-1">+ Thêm ảnh</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryFiles} />
              </label>
              {gallery.map((src, i) => (
                <div key={i} className="relative group">
                  <img src={src} alt="" className="h-24 w-32 rounded-lg object-cover border" />
                  <button type="button" onClick={() => setGallery((g) => g.filter((_, idx) => idx !== i))}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground text-sm leading-none">
                    <Trash2 className="h-3 w-3 mx-auto" />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Bạn có thể chọn nhiều ảnh cùng lúc.</p>
          </div>
        </Card>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-xl font-bold">Các loại phòng</h2>
          <Button variant="outline" size="sm" onClick={() => setRooms((rs) => [...rs, emptyRoom()])}>
            <Plus className="h-4 w-4 mr-1" /> Thêm loại phòng
          </Button>
        </div>

        <div className="space-y-4 mt-4">
          {rooms.map((r, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold">Loại phòng #{i + 1}</div>
                {rooms.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => setRooms((rs) => rs.filter((_, idx) => idx !== i))}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Tên phòng</Label>
                  <Input value={r.name} onChange={(e) => updateRoom(i, { name: e.target.value })} />
                </div>
                <div>
                  <Label>Hạng phòng</Label>
                  <Select value={r.tier} onValueChange={(v) => updateRoom(i, { tier: v as RoomDraft["tier"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Tiêu chuẩn</SelectItem>
                      <SelectItem value="deluxe">Cao cấp</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Số giường</Label>
                  <Input type="number" value={r.beds} onChange={(e) => updateRoom(i, { beds: +e.target.value })} />
                </div>
                <div>
                  <Label>Loại giường</Label>
                  <Input value={r.bedType} onChange={(e) => updateRoom(i, { bedType: e.target.value })} placeholder="VD: 1 giường đôi lớn" />
                </div>
                <div>
                  <Label>Số khách cơ bản</Label>
                  <Input type="number" value={r.basePeople} onChange={(e) => updateRoom(i, { basePeople: +e.target.value })} />
                </div>
                <div>
                  <Label>Số khách tối đa</Label>
                  <Input type="number" value={r.maxPeople} onChange={(e) => updateRoom(i, { maxPeople: +e.target.value })} />
                </div>
                <div>
                  <Label>Hệ số giá (x giá cơ bản)</Label>
                  <Input type="number" step="0.1" value={r.priceMultiplier} onChange={(e) => updateRoom(i, { priceMultiplier: +e.target.value })} />
                </div>
                <div>
                  <Label>Số phòng trống</Label>
                  <Input type="number" value={r.available} onChange={(e) => updateRoom(i, { available: +e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Mô tả phòng</Label>
                  <Textarea rows={2} value={r.description} onChange={(e) => updateRoom(i, { description: e.target.value })} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex justify-end gap-2">
          <Button variant="outline" asChild><Link to="/">Hủy</Link></Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Đang đăng..." : "Đăng chỗ nghỉ"}
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}
