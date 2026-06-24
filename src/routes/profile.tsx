import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, History, Hotel as HotelIcon, KeyRound, Plane, Star, Trash2, User } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ReviewDialog, type ReviewTarget } from "@/components/site/ReviewDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatVND } from "@/lib/mockData";
import { useAuth } from "@/lib/auth";
import { useFavorites } from "@/lib/favorites";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

type BookingRow = {
  id: string;
  type: "tour" | "hotel" | "flight";
  ref_id: string;
  ref_title: string | null;
  total: number;
  status: string;
  created_at: string;
  customer_info: Record<string, unknown> | null;
};

type ReviewRow = { id: string; booking_id: string; rating: number; comment: string };

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString("vi-VN"); } catch { return iso; }
}

function tripEndDate(b: BookingRow): string | undefined {
  const info = (b.customer_info ?? {}) as Record<string, unknown>;
  if (b.type === "hotel") return info.checkOut as string | undefined;
  return (info.date as string | undefined);
}

function isTripCompleted(b: BookingRow): boolean {
  const end = tripEndDate(b);
  if (!end) return false;
  const today = new Date().toISOString().split("T")[0];
  return end <= today;
}

// Resize/compress an uploaded image to a small JPEG data URL (max ~400px).
async function fileToAvatarDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error("read_failed"));
    fr.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("img_failed"));
    i.src = dataUrl;
  });
  const MAX = 400;
  const scale = Math.min(1, MAX / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.82);
}

function BookingList({
  items, emptyText, icon, reviewsByBooking, onReview,
}: {
  items: BookingRow[];
  emptyText: string;
  icon: React.ReactNode;
  reviewsByBooking: Record<string, ReviewRow>;
  onReview: (b: BookingRow, existing?: ReviewRow) => void;
}) {
  if (!items.length) {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
        {icon}{emptyText}
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {items.map((b) => {
        const info = (b.customer_info ?? {}) as Record<string, unknown>;
        const meta: string[] = [`Đặt ngày ${formatDate(b.created_at)}`];
        if (b.type === "tour") {
          if (info.date) meta.push(`Khởi hành ${info.date as string}`);
          if (info.people) meta.push(`${info.people} khách`);
        } else if (b.type === "hotel") {
          if (info.checkIn && info.checkOut) meta.push(`${info.checkIn as string} → ${info.checkOut as string}`);
          if (info.nights) meta.push(`${info.nights} đêm`);
          if (info.rooms) meta.push(`${info.rooms} phòng`);
        } else if (b.type === "flight") {
          if (info.date) meta.push(`Bay ${info.date as string}`);
          if (info.class) meta.push(`Hạng ${info.class as string}`);
        }
        const paid = b.status === "paid";
        const completed = isTripCompleted(b);
        const review = reviewsByBooking[b.id];
        const canReview = paid && completed;
        return (
          <Card key={b.id} className="p-4 flex flex-col sm:flex-row gap-4 sm:items-center">
            <div className="flex gap-4 items-center flex-1 min-w-0">
              <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary inline-flex items-center justify-center shrink-0">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{b.ref_title || b.ref_id}</p>
                <p className="text-xs text-muted-foreground">{meta.join(" · ")}</p>
                {review && (
                  <div className="mt-1 flex items-center gap-1">
                    {[1,2,3,4,5].map((n) => (
                      <Star key={n} className={cn("h-3.5 w-3.5", review.rating >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />
                    ))}
                    {review.comment && <span className="text-xs text-muted-foreground line-clamp-1 ml-1">— {review.comment}</span>}
                  </div>
                )}
              </div>
            </div>
            <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
              <div className="text-right">
                <p className="text-primary font-bold">{formatVND(b.total)}</p>
                <span className={`text-xs font-medium ${paid ? "text-emerald-600" : "text-amber-600"}`}>
                  {paid ? "Đã thanh toán" : b.status === "pending" ? "Chờ thanh toán" : b.status}
                </span>
              </div>
              {canReview && (
                <Button size="sm" variant={review ? "outline" : "default"} onClick={() => onReview(b, review)}>
                  <Star className="h-4 w-4 mr-1" />
                  {review ? "Sửa đánh giá" : "Viết đánh giá"}
                </Button>
              )}
              {paid && !completed && !review && (
                <span className="text-[11px] text-muted-foreground">Đánh giá sau chuyến đi</span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const initial = (user?.name || user?.email || "?").charAt(0).toUpperCase();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [reviews, setReviews] = useState<Record<string, ReviewRow>>({});
  const [loading, setLoading] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [reviewExisting, setReviewExisting] = useState<ReviewRow | null>(null);

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
  }, [user?.id, user?.name, user?.phone]);

  const { items: favorites, loading: favLoading, toggle: toggleFav } = useFavorites();

  const loadReviews = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from("reviews")
      .select("id, booking_id, rating, comment")
      .eq("user_id", uid);
    if (error) return;
    const map: Record<string, ReviewRow> = {};
    (data ?? []).forEach((r) => { map[r.booking_id as string] = r as ReviewRow; });
    setReviews(map);
  }, []);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("id, type, ref_id, ref_title, total, status, created_at, customer_info")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) toast.error("Không tải được lịch sử đặt");
      else setBookings((data ?? []) as BookingRow[]);
      await loadReviews(user.id);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [user?.id, loadReviews]);

  const openReview = (b: BookingRow, existing?: ReviewRow) => {
    if (!user?.id) return;
    setReviewTarget({
      bookingId: b.id, userId: user.id, type: b.type, refId: b.ref_id,
      title: b.ref_title || b.ref_id,
    });
    setReviewExisting(existing ?? null);
    setReviewOpen(true);
  };

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user?.id) return;
    if (!file.type.startsWith("image/")) { toast.error("Chỉ chấp nhận tệp hình ảnh"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh quá lớn (tối đa 5MB)"); return; }
    setUploadingAvatar(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      const { error } = await supabase.from("profiles").update({ avatar_url: dataUrl }).eq("id", user.id);
      if (error) throw error;
      await refreshUser();
      toast.success("Đã cập nhật ảnh đại diện");
    } catch {
      toast.error("Không thể tải ảnh");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleRemoveAvatar() {
    if (!user?.id) return;
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
    if (error) { toast.error("Không thể xoá ảnh"); return; }
    await refreshUser();
    toast.success("Đã xoá ảnh đại diện");
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({ name: name.trim(), phone: phone.trim() || null }).eq("id", user.id);
    setSavingProfile(false);
    if (error) { toast.error("Không thể lưu"); return; }
    await refreshUser();
    toast.success("Đã cập nhật");
  }

  const tourBookings = bookings.filter((b) => b.type === "tour");
  const hotelBookings = bookings.filter((b) => b.type === "hotel");
  const flightBookings = bookings.filter((b) => b.type === "flight");

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <h1 className="text-3xl font-bold font-heading">Hồ sơ cá nhân</h1>
        <Tabs defaultValue="info" className="mt-6">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="info"><User className="h-4 w-4 mr-1" />Thông tin</TabsTrigger>
            <TabsTrigger value="password"><KeyRound className="h-4 w-4 mr-1" />Mật khẩu</TabsTrigger>
            <TabsTrigger value="tours"><History className="h-4 w-4 mr-1" />Đặt tour</TabsTrigger>
            <TabsTrigger value="hotels"><HotelIcon className="h-4 w-4 mr-1" />Đặt phòng</TabsTrigger>
            <TabsTrigger value="flights"><Plane className="h-4 w-4 mr-1" />Vé máy bay</TabsTrigger>
            <TabsTrigger value="favs"><Heart className="h-4 w-4 mr-1" />Yêu thích</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card className="p-6 grid md:grid-cols-[160px_1fr] gap-6">
              <div className="text-center">
                <div className="h-32 w-32 rounded-full bg-primary/20 text-primary inline-flex items-center justify-center text-4xl font-bold overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  disabled={uploadingAvatar}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploadingAvatar ? "Đang tải..." : user?.avatarUrl ? "Đổi avatar" : "Upload avatar"}
                </Button>
                {user?.avatarUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1 w-full text-destructive hover:text-destructive"
                    onClick={handleRemoveAvatar}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Xoá ảnh
                  </Button>
                )}
              </div>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><Label className="mb-2 block">Họ tên</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                  <div><Label className="mb-2 block">Email</Label><Input type="email" defaultValue={user?.email || ""} readOnly /></div>
                  <div><Label className="mb-2 block">SĐT</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                  <div><Label className="mb-2 block">Vai trò</Label><Input defaultValue={user?.role || "user"} readOnly /></div>
                </div>
                <Button type="submit" disabled={savingProfile}>{savingProfile ? "Đang lưu..." : "Lưu thay đổi"}</Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card className="p-6 max-w-md">
              <form onSubmit={(e) => { e.preventDefault(); toast.success("Đã đổi mật khẩu"); }} className="space-y-4">
                <div><Label className="mb-2 block">Mật khẩu hiện tại</Label><Input type="password" /></div>
                <div><Label className="mb-2 block">Mật khẩu mới</Label><Input type="password" /></div>
                <div><Label className="mb-2 block">Xác nhận mật khẩu</Label><Input type="password" /></div>
                <Button type="submit">Đổi mật khẩu</Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="tours">
            {loading ? <p className="text-sm text-muted-foreground">Đang tải...</p> :
              <BookingList items={tourBookings} emptyText="Chưa có tour nào được đặt" icon={<History className="h-5 w-5" />} reviewsByBooking={reviews} onReview={openReview} />}
          </TabsContent>

          <TabsContent value="hotels">
            {loading ? <p className="text-sm text-muted-foreground">Đang tải...</p> :
              <BookingList items={hotelBookings} emptyText="Chưa có phòng nào được đặt" icon={<HotelIcon className="h-5 w-5" />} reviewsByBooking={reviews} onReview={openReview} />}
          </TabsContent>

          <TabsContent value="flights">
            {loading ? <p className="text-sm text-muted-foreground">Đang tải...</p> :
              <BookingList items={flightBookings} emptyText="Chưa có vé máy bay nào được đặt" icon={<Plane className="h-5 w-5" />} reviewsByBooking={reviews} onReview={openReview} />}
          </TabsContent>

          <TabsContent value="favs">
            {favLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải...</p>
            ) : favorites.length === 0 ? (
              <Card className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <Heart className="h-5 w-5" /> Chưa có mục yêu thích nào
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {favorites.map((f) => {
                  const linkTo = f.type === "tour" ? "/tours/$tourId" : "/hotels/$hotelId";
                  const params = f.type === "tour" ? { tourId: f.ref_id } : { hotelId: f.ref_id };
                  return (
                    <Card key={f.id} className="overflow-hidden pt-0 pb-0 gap-0 group relative">
                      <Link to={linkTo} params={params}>
                        {f.ref_image ? (
                          <img src={f.ref_image} alt="" className="h-32 w-full object-cover" />
                        ) : (
                          <div className="h-32 w-full bg-muted" />
                        )}
                      </Link>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          {f.type === "tour"
                            ? <History className="h-3.5 w-3.5 text-primary" />
                            : <HotelIcon className="h-3.5 w-3.5 text-primary" />}
                          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            {f.type === "tour" ? "Tour" : "Khách sạn"}
                          </span>
                        </div>
                        <Link to={linkTo} params={params} className="hover:text-primary">
                          <p className="font-medium text-sm line-clamp-1">{f.ref_title || f.ref_id}</p>
                        </Link>
                        {f.ref_price != null && <p className="text-primary font-bold mt-1">{formatVND(Number(f.ref_price))}</p>}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-2 w-full text-destructive hover:text-destructive"
                          onClick={() => toggleFav({ type: f.type, refId: f.ref_id })}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Bỏ yêu thích
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {reviewTarget && (
          <ReviewDialog
            open={reviewOpen}
            onOpenChange={setReviewOpen}
            target={reviewTarget}
            existing={reviewExisting}
            onSaved={() => user?.id && loadReviews(user.id)}
          />
        )}
      </div>
    </SiteLayout>
  );
}
