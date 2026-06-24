import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BedDouble,
  Check,
  Clock,
  Crown,
  MapPin,
  Star,
  Users,
  Wifi,
  Coffee,
  Utensils,
  Waves,
  Dumbbell,
  ParkingCircle,
  Wind,
  Tv,
  Bath,
  ShieldCheck,
  MessageSquare,
  Heart,
  Share2,
  ChevronDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAdminVersion } from "@/lib/adminStore";
import { buildGoogleMapsUrl, buildOsmEmbedUrl } from "@/lib/cityCoords";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";
import {
  formatVND,
  getHotelDescription,
  hotels,
  hydrateHotelDetails,
  type Hotel,
} from "@/lib/mockData";
import phuquoc from "@/assets/dest-phuquoc.jpg";
import dalat from "@/assets/dest-dalat.jpg";
import danang from "@/assets/dest-danang.jpg";
import nhatrang from "@/assets/dest-nhatrang.jpg";
import hanoi from "@/assets/dest-hanoi.jpg";
import hcm from "@/assets/dest-hcm.jpg";

export const Route = createFileRoute("/hotels/$hotelId")({
  component: HotelDetailPage,
});

const tierLabel: Record<string, { label: string; color: string }> = {
  standard: { label: "Tiêu chuẩn", color: "bg-secondary text-secondary-foreground" },
  deluxe: { label: "Cao cấp", color: "bg-sky-500 text-white" },
  vip: { label: "VIP", color: "bg-gradient-to-r from-amber-500 to-orange-500 text-white" },
};

const galleryPool = [phuquoc, dalat, danang, nhatrang, hanoi, hcm];

const amenityIcons: Record<string, typeof Wifi> = {
  Wifi,
  "Hồ bơi": Waves,
  "Bãi biển riêng": Waves,
  Spa: Heart,
  Gym: Dumbbell,
  "Nhà hàng": Utensils,
  "View biển": Waves,
  "View núi": MapPin,
  "View thành phố": MapPin,
  "Cổ điển": Crown,
  "Nhà hàng Pháp": Utensils,
};

const faqs = (name: string) => [
  {
    q: `${name} có những loại phòng nào?`,
    a: "Khách sạn cung cấp đa dạng các loại phòng từ Tiêu chuẩn, Cao cấp đến VIP Suite, phù hợp cho cá nhân, cặp đôi và gia đình.",
  },
  {
    q: `Giá phòng ${name} là bao nhiêu?`,
    a: "Giá phụ thuộc vào loại phòng và số khách. Bạn có thể xem bảng giá chi tiết ở mục Phòng trống bên dưới.",
  },
  {
    q: `${name} có gần các điểm tham quan không?`,
    a: "Khách sạn nằm ở vị trí trung tâm, dễ dàng di chuyển tới các điểm tham quan, nhà hàng và quán cà phê nổi tiếng.",
  },
  {
    q: `Chính sách hủy phòng tại ${name} thế nào?`,
    a: "Hầu hết các phòng đều miễn phí hủy trước 24h. Xem chi tiết khi chọn từng loại phòng.",
  },
];

function HotelDetailPage() {
  useAdminVersion();
  const { hotelId } = Route.useParams();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [dbHotel, setDbHotel] = useState<Hotel | null>(null);
  const hotel = (hotels.find((h) => h.id === hotelId) as Hotel | undefined) ?? dbHotel ?? undefined;
  const { isFavorite, toggle } = useFavorites();
  const fav = hotel ? isFavorite("hotel", hotel.id) : false;
  const onToggleFav = () => {
    if (!hotel) return;
    toggle({ type: "hotel", refId: hotel.id, title: hotel.name, image: hotel.image, price: hotel.price });
  };

  useEffect(() => {
    if (hotel || dbHotel?.id === hotelId) return;
    let active = true;
    supabase
      .from("hotels")
      .select("*")
      .eq("id", hotelId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data) return;
        const mapped = hydrateHotelDetails({
          id: data.id,
          name: data.name,
          address: data.city,
          city: data.city,
          price: Number(data.price),
          rating: Number(data.rating ?? 4.5),
          stars: data.stars ?? 3,
          image: data.image ?? "",
          amenities: [],
          checkIn: data.check_in ?? undefined,
          checkOut: data.check_out ?? undefined,
          description: data.description ?? "",
          requirements: data.requirements ? String(data.requirements).split("|") : [],
          gallery: ((data as { gallery?: unknown }).gallery as string[]) ?? [],
        });
        if (!hotels.find((h) => h.id === mapped.id)) hotels.unshift(mapped);
        setDbHotel(mapped);
      });
    return () => {
      active = false;
    };
  }, [dbHotel?.id, hotel, hotelId]);
  if (!hotel) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Đang tải khách sạn...</h1>
          <p className="text-muted-foreground">
            Nếu trang không hiện, hãy thử{" "}
            <Link to="/hotels" className="text-primary underline">
              quay lại danh sách khách sạn
            </Link>
            .
          </p>
        </div>
      </SiteLayout>
    );
  }
  const rooms = hotel.rooms ?? [];
  const totalRooms = rooms.reduce((s, r) => s + r.available, 0);
  const description = hotel.description?.trim() || getHotelDescription(hotel);

  // Build a gallery: use hotel.gallery if provided, otherwise fall back to destination pool
  const uploaded = (hotel.gallery ?? []).filter(Boolean);
  const gallery =
    uploaded.length > 0
      ? [hotel.image, ...uploaded].slice(0, 7)
      : [hotel.image, ...galleryPool.filter((g) => g !== hotel.image)].slice(0, 7);

  const subScores = [
    { label: "Nhân viên phục vụ", v: 9.5 },
    { label: "Tiện nghi", v: 9.2 },
    { label: "Sạch sẽ", v: 9.4 },
    { label: "Thoải mái", v: 9.3 },
    { label: "Đáng giá tiền", v: 9.0 },
    { label: "Vị trí", v: 9.1 },
    { label: "Wifi miễn phí", v: 8.9 },
  ];

  const reviewers = [
    {
      name: "Hoàng",
      country: "Việt Nam",
      text: "Phòng rộng rãi, view đẹp tuyệt vời. Nhân viên thân thiện, đồ ăn ngon. Sẽ quay lại lần sau!",
    },
    {
      name: "Vi",
      country: "Việt Nam",
      text: "Nhân viên cực kỳ nhiệt tình, giao tiếp tốt. Khách sạn sạch sẽ, gần nhiều điểm tham quan.",
    },
    {
      name: "Ngân",
      country: "Việt Nam",
      text: "Chỗ này tuyệt vời, đỗ thường xuyên ghé lại khi tới đây. Rất khuyến khích cho những ai cần nghỉ dưỡng.",
    },
  ];

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-500">{"★".repeat(hotel.stars)}</span>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                Khách sạn {hotel.stars} sao
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-heading">{hotel.name}</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              {hotel.address} ·{" "}
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-primary underline cursor-pointer hover:text-primary/80">
                    Vị trí xuất sắc – Xem bản đồ
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      {hotel.name}
                    </DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground -mt-2">
                    {[hotel.address, hotel.city].filter(Boolean).join(", ")}
                  </p>
                  {buildOsmEmbedUrl(hotel) ? (
                    <iframe
                      src={buildOsmEmbedUrl(hotel)!}
                      title={`Bản đồ ${hotel.name}`}
                      className="w-full h-[420px] rounded-lg border"
                      loading="lazy"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      Chưa có dữ liệu bản đồ cho địa điểm này.
                    </p>
                  )}
                  <div className="flex justify-end">
                    <Button asChild variant="outline" size="sm">
                      <a href={buildGoogleMapsUrl(hotel)} target="_blank" rel="noopener noreferrer">
                        Mở trong Google Maps
                      </a>
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleFav}
              aria-label="Yêu thích"
              aria-pressed={fav}
            >
              <Heart className={cn("h-4 w-4", fav && "fill-rose-500 text-rose-500")} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={async () => {
                const url = window.location.href;
                const shareData = { title: hotel.name, text: `Xem khách sạn ${hotel.name}`, url };
                try {
                  if (navigator.share) {
                    await navigator.share(shareData);
                  } else {
                    await navigator.clipboard.writeText(url);
                    toast.success("Đã sao chép liên kết");
                  }
                } catch {
                  try {
                    await navigator.clipboard.writeText(url);
                    toast.success("Đã sao chép liên kết");
                  } catch {
                    toast.error("Không thể chia sẻ");
                  }
                }
              }}
              aria-label="Chia sẻ"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button size="lg" asChild>
              <a href="#rooms">Đặt phòng</a>
            </Button>
          </div>
        </div>

        {/* Gallery grid */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px] rounded-2xl overflow-hidden">
          <img
            src={gallery[0]}
            alt={hotel.name}
            className="col-span-2 row-span-2 w-full h-full object-cover"
          />
          {gallery.slice(1, 5).map((g, i) => (
            <img
              key={i}
              src={g}
              alt={`${hotel.name} ${i + 2}`}
              className="w-full h-full object-cover"
            />
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8 mt-6">
          <div>
            {/* Highlights */}
            <Card className="p-5">
              <h2 className="font-heading font-semibold text-lg mb-3">Điểm nổi bật của chỗ nghỉ</h2>
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-0.5" /> Vị trí đắc địa tại {hotel.city}
                </div>
                <div className="flex items-start gap-2">
                  <Wifi className="h-4 w-4 text-primary mt-0.5" /> Wifi miễn phí tốc độ cao
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary mt-0.5" /> Hủy phòng linh hoạt
                </div>
              </div>
              <Separator className="my-4" />
              <p className="text-sm leading-relaxed whitespace-pre-line">{description}</p>
            </Card>

            {/* Room availability table */}
            <Card className="p-5 mt-4" id="rooms">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
                  <BedDouble className="h-5 w-5 text-primary" />
                  Phòng trống
                </h2>
                <Badge variant="outline">
                  {rooms.length} loại · {totalRooms} phòng trống
                </Badge>
              </div>

              {rooms.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Khách sạn này chưa cập nhật bảng phòng chi tiết. Vui lòng liên hệ để được tư vấn.
                </p>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-primary text-primary-foreground text-left">
                          <th className="p-3 rounded-tl-lg">Loại chỗ nghỉ</th>
                          <th className="p-3">Số lượng khách</th>
                          <th className="p-3">Giá hôm nay</th>
                          <th className="p-3">Lựa chọn của bạn</th>
                          <th className="p-3 rounded-tr-lg">Chọn</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rooms.map((r) => {
                          const price = Math.round(hotel.price * r.priceMultiplier);
                          const tier = tierLabel[r.tier];
                          return (
                            <tr key={r.id} className="border-b align-top">
                              <td className="p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <Link
                                    to="/booking/hotel/$hotelId"
                                    params={{ hotelId: hotel.id }}
                                    search={{ roomId: r.id }}
                                    className="font-semibold text-primary hover:underline"
                                  >
                                    {r.name}
                                  </Link>
                                  <Badge className={tier.color}>
                                    {r.tier === "vip" && <Crown className="h-3 w-3 mr-1" />}
                                    {tier.label}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                  <BedDouble className="h-3 w-3" /> {r.beds} giường · {r.bedType}
                                </div>
                                <p className="text-xs leading-relaxed text-muted-foreground line-clamp-3">
                                  {r.description}
                                </p>
                                <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Wifi className="h-3 w-3" /> Wifi miễn phí
                                  </span>
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Wind className="h-3 w-3" /> Máy lạnh
                                  </span>
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Tv className="h-3 w-3" /> TV
                                  </span>
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                    <Bath className="h-3 w-3" /> Phòng tắm riêng
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: r.basePeople }).map((_, i) => (
                                    <Users key={i} className="h-4 w-4" />
                                  ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Tối đa {r.maxPeople} khách
                                </p>
                              </td>
                              <td className="p-3">
                                <p className="font-bold text-primary text-lg">{formatVND(price)}</p>
                                <p className="text-[11px] text-muted-foreground">
                                  / đêm cho {r.basePeople} khách
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  +{Math.round((hotel.extraFeeRate ?? 0.25) * 100)}% mỗi khách dư
                                </p>
                              </td>
                              <td className="p-3">
                                <ul className="space-y-1 text-xs">
                                  <li className="flex items-start gap-1 text-emerald-600">
                                    <Check className="h-3 w-3 mt-0.5" />
                                    Hủy miễn phí 24h
                                  </li>
                                  <li className="flex items-start gap-1 text-emerald-600">
                                    <Check className="h-3 w-3 mt-0.5" />
                                    Không cần trả trước
                                  </li>
                                  <li className="flex items-start gap-1 text-emerald-600">
                                    <Check className="h-3 w-3 mt-0.5" />
                                    Bữa sáng miễn phí
                                  </li>
                                  <li className="text-red-600">Còn {r.available} phòng</li>
                                </ul>
                              </td>
                              <td className="p-3">
                                <Button size="sm" asChild>
                                  <Link
                                    to="/booking/hotel/$hotelId"
                                    params={{ hotelId: hotel.id }}
                                    search={{ roomId: r.id }}
                                  >
                                    Đặt ngay
                                  </Link>
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {rooms.map((r) => {
                      const price = Math.round(hotel.price * r.priceMultiplier);
                      const tier = tierLabel[r.tier];
                      return (
                        <div key={r.id} className="border rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{r.name}</h3>
                            <Badge className={tier.color}>{tier.label}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">
                            {r.beds} giường · {r.bedType} · Tối đa {r.maxPeople} khách
                          </p>
                          <p className="text-xs mb-2">{r.description}</p>
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-primary font-bold">{formatVND(price)}</p>
                              <p className="text-[11px] text-muted-foreground">
                                Còn {r.available} phòng
                              </p>
                            </div>
                            <Button size="sm" asChild>
                              <Link
                                to="/booking/hotel/$hotelId"
                                params={{ hotelId: hotel.id }}
                                search={{ roomId: r.id }}
                              >
                                Đặt
                              </Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </Card>

            {/* Reviews */}
            <Card className="p-5 mt-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="font-heading font-semibold text-lg">Đánh giá của khách</h2>
                <Button size="sm" asChild>
                  <a href="#rooms">Đặt phòng ngay</a>
                </Button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 font-bold text-lg">
                  {hotel.rating}
                </div>
                <div>
                  <p className="font-semibold">Tuyệt hảo</p>
                  <p className="text-xs text-muted-foreground">
                    Dựa trên {120 + hotel.stars * 30} đánh giá
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mb-4">
                {subScores.map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{s.label}</span>
                      <span className="font-semibold">{s.v}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${s.v * 10}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {reviewers.map((rv) => (
                  <div key={rv.name} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary grid place-items-center text-sm font-semibold">
                        {rv.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">{rv.name}</p>
                        <p className="text-[11px] text-muted-foreground">{rv.country}</p>
                      </div>
                    </div>
                    <p className="text-xs leading-relaxed">"{rv.text}"</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Amenities */}
            <Card className="p-5 mt-4">
              <h2 className="font-heading font-semibold text-lg mb-3">
                Các tiện nghi của {hotel.name}
              </h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                {hotel.amenities.map((a) => {
                  const Icon = amenityIcons[a] ?? Check;
                  return (
                    <div key={a} className="flex items-center gap-2 text-sm">
                      <Icon className="h-4 w-4 text-emerald-600" /> {a}
                    </div>
                  );
                })}
                {["Lễ tân 24h", "Bữa sáng", "Đỗ xe miễn phí", "Nhận phòng nhanh"].map((a) => (
                  <div key={a} className="flex items-center gap-2 text-sm">
                    {a.includes("xe") ? (
                      <ParkingCircle className="h-4 w-4 text-emerald-600" />
                    ) : a.includes("sáng") ? (
                      <Coffee className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Check className="h-4 w-4 text-emerald-600" />
                    )}{" "}
                    {a}
                  </div>
                ))}
              </div>
            </Card>

            {/* Rules */}
            <Card className="p-5 mt-4">
              <h2 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Quy tắc chung
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div className="border rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Nhận phòng từ</p>
                  <p className="font-bold text-lg text-primary mt-1">{hotel.checkIn}</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-muted-foreground text-xs">Trả phòng trước</p>
                  <p className="font-bold text-lg text-primary mt-1">{hotel.checkOut}</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                {hotel.requirements?.map((r) => (
                  <li key={r} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </Card>

            {/* FAQ */}
            <Card className="p-5 mt-4">
              <h2 className="font-heading font-semibold text-lg mb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Câu hỏi thường gặp về {hotel.name}
              </h2>
              <div className="space-y-2">
                {faqs(hotel.name).map((f, i) => (
                  <Collapsible
                    key={i}
                    open={openFaq === i}
                    onOpenChange={(o) => setOpenFaq(o ? i : null)}
                  >
                    <CollapsibleTrigger className="w-full flex items-center justify-between text-left border rounded-lg p-3 hover:bg-muted/40 transition">
                      <span className="text-sm font-medium">{f.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-3 py-2 text-sm text-muted-foreground">
                      {f.a}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </Card>
          </div>

          {/* Sticky booking box */}
          <Card className="p-6 h-fit sticky top-20">
            <p className="text-xs text-muted-foreground">Giá khởi điểm / đêm</p>
            <p className="text-3xl font-bold text-primary font-heading mt-1">
              {formatVND(hotel.price)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Giá thay đổi theo loại phòng (Tiêu chuẩn / Cao cấp / VIP) và số khách
            </p>
            <div className="flex items-center gap-1 text-sm mt-3">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{hotel.rating}</span>
              <span className="text-muted-foreground">· {"★".repeat(hotel.stars)}</span>
            </div>
            <Button className="w-full mt-5" size="lg" asChild>
              <a href="#rooms">Chọn phòng</a>
            </Button>
            <Button variant="outline" className="w-full mt-2" asChild>
              <Link to="/hotels">Xem khách sạn khác</Link>
            </Button>
            <Separator className="my-4" />
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-600" /> Hủy miễn phí trước 24h
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-600" /> Không cần trả trước
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-600" /> Giá tốt nhất đảm bảo
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </SiteLayout>
  );
}
