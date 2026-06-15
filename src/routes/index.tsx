import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Calendar, MapPin, Plane, Search, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import heroImg from "@/assets/hero.jpg";
import { SiteLayout } from "@/components/site/SiteLayout";
import { TourCard } from "@/components/site/TourCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTodayDateInputValue } from "@/lib/dateGuards";
import { airports, destinations, flights, formatVND, promos, tours } from "@/lib/mockData";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState("");
  const [departure, setDeparture] = useState("");
  const [tab, setTab] = useState("tours");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const today = getTodayDateInputValue();
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 -z-10">
          <img src={heroImg} alt="Vietnam travel hero" width={1920} height={1280} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/40 to-cyan-900/60" />
        </div>
        <div className="container mx-auto px-4 py-24 md:py-36 text-white">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur border border-white/20">
              <Sparkles className="h-3 w-3" /> #1 Nền tảng du lịch Việt Nam
            </span>
            <h1 className="mt-5 text-4xl md:text-6xl font-bold font-heading text-balance leading-tight">
              Khám phá Việt Nam <br />theo cách của bạn
            </h1>
            <p className="mt-5 text-lg text-white/85 max-w-xl">
              Hơn 5,000+ tour du lịch, 10,000+ khách sạn và vé máy bay giá tốt nhất. Đặt nhanh trong vài giây.
            </p>
          </div>

          {/* Search box */}
          <Card className="mt-10 p-4 md:p-6 bg-white/95 text-foreground shadow-2xl max-w-5xl">
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="bg-secondary">
                <TabsTrigger value="tours"><MapPin className="h-4 w-4 mr-1" />Tour</TabsTrigger>
                <TabsTrigger value="hotels">🏨 Khách sạn</TabsTrigger>
                <TabsTrigger value="flights"><Plane className="h-4 w-4 mr-1" />Vé máy bay</TabsTrigger>
              </TabsList>
            </Tabs>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (tab === "hotels") navigate({ to: "/hotels" });
                else if (tab === "flights") navigate({ to: "/flights" });
                else navigate({ to: "/tours", search: { q: destination } });
              }}
              className={`grid gap-3 mt-4 ${tab === "hotels" || tab === "flights" ? "md:grid-cols-[1fr_1fr_1fr_1fr_auto]" : "md:grid-cols-[1fr_1fr_1fr_auto]"}`}
            >
              {tab === "flights" ? (() => {
                const sortedAirports = [...airports].sort((a, b) => a.city.localeCompare(b.city));
                const reachable = departure
                  ? sortedAirports.filter((a) => a.code !== departure && flights.some((f) => f.from === departure && f.to === a.code))
                  : [];
                return (
                  <>
                    <div className="relative">
                      <Plane className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Select value={departure} onValueChange={(v) => { setDeparture(v); setDestination(""); }}>
                        <SelectTrigger className="pl-9 h-12 w-full"><SelectValue placeholder="Điểm đi" /></SelectTrigger>
                        <SelectContent className="max-h-72">
                          {sortedAirports.map((a) => <SelectItem key={a.code} value={a.code}>{a.city} ({a.code})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Select value={destination} onValueChange={setDestination} disabled={!departure}>
                        <SelectTrigger className="pl-9 h-12 w-full"><SelectValue placeholder={departure ? "Điểm đến" : "Chọn điểm đi trước"} /></SelectTrigger>
                        <SelectContent className="max-h-72">
                          {reachable.length === 0 ? (
                            <div className="px-2 py-2 text-sm text-muted-foreground">Không có chuyến phù hợp</div>
                          ) : reachable.map((a) => <SelectItem key={a.code} value={a.code}>{a.city} ({a.code})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                );
              })() : (
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Select value={destination} onValueChange={setDestination}>
                    <SelectTrigger className="pl-9 h-12 w-full"><SelectValue placeholder="Điểm đến" /></SelectTrigger>
                    <SelectContent>
                      {destinations.map((d) => <SelectItem key={d.slug} value={d.name}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {tab === "hotels" ? (
                <>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Input type="date" aria-label="Nhận phòng" min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="pl-9 h-12" placeholder="Nhận phòng" />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Input type="date" aria-label="Trả phòng" min={checkIn || today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="pl-9 h-12" placeholder="Trả phòng" />
                  </div>
                </>
              ) : (
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Input type="date" min={today} className="pl-9 h-12" />
                </div>
              )}
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={2}
                  placeholder="Số người"
                  className="pl-9 h-12"
                  onChange={(e) => {
                    const v = Math.max(1, Math.floor(+e.target.value || 1));
                    if (+e.target.value !== v) e.target.value = String(v);
                  }}
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8 text-base">
                <Search className="h-4 w-4 mr-2" />Tìm kiếm
              </Button>
            </form>
            {tab === "hotels" && (
              <p className="text-xs text-muted-foreground mt-2">Chọn ngày nhận phòng và trả phòng để xem giá chính xác</p>
            )}
          </Card>



          <div className="mt-10 grid grid-cols-3 max-w-md gap-6 text-white/90">
            {[{ n: "5K+", l: "Tours" }, { n: "10K+", l: "Khách sạn" }, { n: "1M+", l: "Khách hàng" }].map((s) => (
              <div key={s.l}>
                <div className="text-3xl font-bold font-heading">{s.n}</div>
                <div className="text-sm text-white/70">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section className="container mx-auto px-4 py-20">
        <SectionHeader
          eyebrow="Điểm đến"
          title="Điểm đến phổ biến"
          subtitle="Những thành phố được du khách yêu thích nhất"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-10">
          {destinations.slice(0, 12).map((d) => (
            <Link
              key={d.slug}
              to="/tours"
              search={{ q: d.name }}
              className="group relative overflow-hidden rounded-2xl aspect-[3/4] hover:shadow-xl transition"
            >
              <img src={d.image} alt={d.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="font-bold font-heading text-lg">{d.name}</h3>
                <p className="text-xs text-white/80 line-clamp-1">{d.description}</p>
                <p className="text-xs mt-1 text-cyan-300 font-semibold">Từ {formatVND(d.fromPrice)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Promos */}
      <section className="container mx-auto px-4 pb-10">
        <div className="grid md:grid-cols-3 gap-4">
          {promos.map((p) => (
            <div key={p.title} className={`relative overflow-hidden rounded-2xl p-6 text-white bg-gradient-to-br ${p.color}`}>
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
              <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10" />
              <p className="text-xs font-semibold uppercase opacity-80 relative">Khuyến mãi</p>
              <h3 className="text-2xl font-bold font-heading mt-1 relative">{p.title}</h3>
              <p className="mt-1 opacity-90 relative">{p.subtitle}</p>
              <Button variant="secondary" size="sm" className="mt-4 relative" asChild>
                <a href={p.href}>Khám phá <ArrowRight className="h-3 w-3 ml-1" /></a>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Trending tours */}
      <section className="container mx-auto px-4 py-20">
        <div className="flex items-end justify-between mb-10">
          <SectionHeader eyebrow="Trending" title="Tours nổi bật" subtitle="Lựa chọn yêu thích từ hàng nghìn khách hàng" />
          <Button variant="outline" asChild className="hidden md:inline-flex">
            <Link to="/tours">Xem tất cả <ArrowRight className="h-4 w-4 ml-1" /></Link>
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tours.slice(0, 6).map((t) => <TourCard key={t.id} tour={t} />)}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 pb-20">
        <div className="relative overflow-hidden rounded-3xl hero-gradient p-10 md:p-16 text-white text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-heading">Sẵn sàng cho chuyến đi tiếp theo?</h2>
          <p className="mt-3 text-white/85 max-w-xl mx-auto">Đăng ký nhận ưu đãi sớm nhất và những điểm đến mới nhất.</p>
          <Button size="lg" variant="secondary" className="mt-6" asChild>
            <Link to="/register">Đăng ký miễn phí</Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-primary font-semibold uppercase text-xs tracking-wider">{eyebrow}</p>
      <h2 className="text-3xl md:text-4xl font-bold font-heading mt-2">{title}</h2>
      <p className="text-muted-foreground mt-2 max-w-xl">{subtitle}</p>
    </div>
  );
}
