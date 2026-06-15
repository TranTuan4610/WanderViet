import { createFileRoute, Link } from "@tanstack/react-router";
import { Calendar, Check, Heart, Share2, Star, X } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminVersion } from "@/lib/adminStore";
import { formatVND, tours, type Tour } from "@/lib/mockData";
import { getTourVideoEmbedUrl } from "@/lib/tourVideos";
import { useFavorites } from "@/lib/favorites";
import { cn } from "@/lib/utils";


export const Route = createFileRoute("/tours/$tourId")({
  component: TourDetailPage,
});

function normalizeScheduleItem(item: Tour["schedule"][number]) {
  const title = item.title.trim();
  const detail = item.detail.trim();
  const titleLooksLikeBody = title.length > 90 || /[.!?…]/.test(title);

  if (!detail && titleLooksLikeBody) {
    return { heading: `Ngày ${item.day}`, body: title.replace(/^Ngày\s*\d+\s*:\s*/i, "") };
  }

  return { heading: title || `Ngày ${item.day}`, body: detail };
}

function TourDetailPage() {
  useAdminVersion();
  const { tourId } = Route.useParams();
  const tour = tours.find((t) => t.id === tourId) as Tour | undefined;
  const { isFavorite, toggle } = useFavorites();
  const fav = tour ? isFavorite("tour", tour.id) : false;
  const onToggleFav = () => {
    if (!tour) return;
    toggle({ type: "tour", refId: tour.id, title: tour.title, image: tour.image, price: tour.price });
  };
  if (!tour) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Đang tải tour...</h1>
          <p className="text-muted-foreground">
            Nếu trang không hiện, hãy thử{" "}
            <Link to="/tours" className="text-primary underline">
              quay lại danh sách
            </Link>
            .
          </p>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary">
            Trang chủ
          </Link>{" "}
          /{" "}
          <Link to="/tours" className="hover:text-primary">
            Tours
          </Link>{" "}
          / <span>{tour.title}</span>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          <div>
            {/* Gallery */}
            {(() => {
              const extras = (tour.gallery ?? []).filter(Boolean).slice(0, 4);
              const fillers = Array.from({ length: Math.max(0, 4 - extras.length) }, () => tour.image);
              const thumbs = [...extras, ...fillers];
              return (
                <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px] rounded-2xl overflow-hidden">
                  <img src={tour.image} alt={tour.title} className="col-span-2 row-span-2 h-full w-full object-cover" />
                  {thumbs.map((src, i) => (
                    <img key={i} src={src} alt="" className="h-full w-full object-cover opacity-90 hover:opacity-100 transition" />
                  ))}
                </div>
              );
            })()}

            <div className="mt-6 flex items-start justify-between gap-4 flex-wrap">
              <div>
                <Badge variant="secondary">{tour.type}</Badge>
                <h1 className="text-3xl md:text-4xl font-bold font-heading mt-2">{tour.title}</h1>
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {tour.rating} (
                    {tour.reviews} đánh giá)
                  </span>
                  <span>{"★".repeat(tour.stars)}</span>
                  <span>📍 {tour.destination}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onToggleFav}
                  aria-pressed={fav}
                >
                  <Heart className={cn("h-4 w-4", fav && "fill-rose-500 text-rose-500")} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toast.success("Đã sao chép link")}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Tabs defaultValue="desc" className="mt-8">
              <TabsList>
                <TabsTrigger value="desc">Mô tả</TabsTrigger>
                <TabsTrigger value="schedule">Lịch trình</TabsTrigger>
                <TabsTrigger value="includes">Dịch vụ</TabsTrigger>
                <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
              </TabsList>
              <TabsContent value="desc" className="mt-4">
                <p className="text-foreground/85 leading-relaxed">{tour.description}</p>
                <div className="aspect-video w-full mt-6 rounded-xl overflow-hidden bg-muted">
                  <iframe
                    src={getTourVideoEmbedUrl(tour.destination, tour.id, tour.videoUrl)}
                    title={`Video giới thiệu ${tour.title}`}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>

              </TabsContent>
              <TabsContent value="schedule" className="mt-4 space-y-4">
                {tour.schedule.map((s) => {
                  const { heading, body } = normalizeScheduleItem(s);

                  return (
                    <Card key={s.day} className="p-5">
                      <div className="grid grid-cols-[2rem_1fr] gap-x-3 gap-y-1 items-start">
                        <span className="h-8 w-8 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center text-sm font-bold shrink-0">
                          {s.day}
                        </span>
                        <h3 className="font-sans text-base font-semibold leading-6 text-foreground">
                          Ngày {s.day}: {heading}
                        </h3>
                        {body && (
                          <p className="col-start-2 text-sm font-normal leading-6 text-muted-foreground whitespace-pre-line">
                            {body}
                          </p>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </TabsContent>
              <TabsContent value="includes" className="mt-4 grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 text-emerald-600">Bao gồm</h3>
                  <ul className="space-y-2">
                    {tour.included.map((i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 text-destructive">Không bao gồm</h3>
                  <ul className="space-y-2">
                    {tour.excluded.map((i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>
              <TabsContent value="reviews" className="mt-4 space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-full bg-primary/20 inline-flex items-center justify-center font-semibold">
                        K{i}
                      </div>
                      <div>
                        <p className="font-medium">Khách hàng {i}</p>
                        <p className="text-xs text-muted-foreground">
                          {"★".repeat(5)} · 2 tuần trước
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/85">
                      Tour rất tuyệt, HDV nhiệt tình, lịch trình hợp lý, sẽ ủng hộ lần sau!
                    </p>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sticky booking sidebar */}
          <aside>
            <Card className="p-6 sticky top-20">
              {tour.oldPrice && (
                <p className="text-sm text-muted-foreground line-through">
                  {formatVND(tour.oldPrice)}
                </p>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary">{formatVND(tour.price)}</span>
                <span className="text-sm text-muted-foreground">/khách</span>
              </div>
              <div className="my-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Thời gian</span>
                  <span className="font-medium">
                    {tour.days}N{tour.nights}Đ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chỗ còn lại</span>
                  <span className="font-medium text-emerald-600">{tour.seatsLeft} chỗ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đánh giá</span>
                  <span className="font-medium">{tour.rating}/5</span>
                </div>
              </div>
              <Button asChild size="lg" className="w-full">
                <Link to="/booking/$tourId" params={{ tourId: tour.id }}>
                  Đặt ngay
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full mt-2"
                onClick={onToggleFav}
              >
                <Heart className={cn("h-4 w-4 mr-2", fav && "fill-rose-500 text-rose-500")} />
                {fav ? "Bỏ yêu thích" : "Thêm yêu thích"}
              </Button>
              <div className="mt-4 text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <Calendar className="h-3 w-3" /> Hủy miễn phí trong 24h
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}
