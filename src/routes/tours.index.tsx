import { createFileRoute } from "@tanstack/react-router";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { TourCard } from "@/components/site/TourCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAdminVersion } from "@/lib/adminStore";
import { destinations, tours, type Tour } from "@/lib/mockData";

const searchSchema = z.object({ q: z.string().optional(), type: z.string().optional() });

export const Route = createFileRoute("/tours/")({
  component: ToursPage,
  validateSearch: searchSchema,
});

const tourTypes: Tour["type"][] = ["Biển", "Núi", "Văn hóa", "Thành phố"];
const durationOptions = [
  { label: "1-2 ngày", min: 1, max: 2 },
  { label: "3-4 ngày", min: 3, max: 4 },
  { label: "5-7 ngày", min: 5, max: 7 },
  { label: "Trên 7 ngày", min: 8, max: 99 },
];
const departOptions = [
  { value: "any", label: "Bất kỳ" },
  { value: "this-week", label: "Tuần này" },
  { value: "this-month", label: "Tháng này" },
  { value: "next-month", label: "Tháng sau" },
];

function ToursPage() {
  const adminVersion = useAdminVersion();
  const { q, type: initialType } = Route.useSearch();
  const maxTourPrice = Math.ceil(Math.max(10_000_000, ...tours.map((t) => t.price)) / 1_000_000) * 1_000_000;
  const [query, setQuery] = useState(q ?? "");
  const [destination, setDestination] = useState<string>("all");
  const [price, setPrice] = useState<[number, number]>([0, Number.MAX_SAFE_INTEGER]);
  const sliderPrice: [number, number] = [price[0], price[1] === Number.MAX_SAFE_INTEGER ? maxTourPrice : price[1]];
  const [types, setTypes] = useState<string[]>(initialType ? [initialType] : []);
  const [stars, setStars] = useState<number[]>([]);
  const [durations, setDurations] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [depart, setDepart] = useState<string>("any");
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(1);
  const perPage = 6;

  const filtered = useMemo(() => {
    let r = tours.filter((t) => {
      const matchQ =
        !query ||
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.destination.toLowerCase().includes(query.toLowerCase());
      const matchDest = destination === "all" || t.destination === destination;
      const matchP = t.price >= price[0] && (price[1] === Number.MAX_SAFE_INTEGER || t.price <= price[1]);
      const matchT = types.length === 0 || types.includes(t.type);
      const matchS = stars.length === 0 || stars.includes(t.stars);
      const matchDur =
        durations.length === 0 ||
        durationOptions
          .filter((d) => durations.includes(d.label))
          .some((d) => t.days >= d.min && t.days <= d.max);
      const matchRating = t.rating >= minRating;
      // depart is mock — all tours pass since mock data has no real dates
      return matchQ && matchDest && matchP && matchT && matchS && matchDur && matchRating;
    });
    if (sort === "price-asc") r = [...r].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") r = [...r].sort((a, b) => b.price - a.price);
    if (sort === "rating") r = [...r].sort((a, b) => b.rating - a.rating);
    if (sort === "duration-asc") r = [...r].sort((a, b) => a.days - b.days);
    if (sort === "duration-desc") r = [...r].sort((a, b) => b.days - a.days);
    if (sort === "popular") r = [...r].sort((a, b) => b.reviews - a.reviews);
    return r;
  }, [adminVersion, query, destination, price, types, stars, durations, minRating, depart, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * perPage, safePage * perPage);

  const resetAll = () => {
    setQuery("");
    setDestination("all");
    setPrice([0, Number.MAX_SAFE_INTEGER]);
    setTypes([]);
    setStars([]);
    setDurations([]);
    setMinRating(0);
    setDepart("any");
    setPage(1);
  };

  const activeChips: { label: string; onClear: () => void }[] = [];
  if (query) activeChips.push({ label: `Từ khóa: ${query}`, onClear: () => setQuery("") });
  if (destination !== "all")
    activeChips.push({ label: destination, onClear: () => setDestination("all") });
  if (price[0] > 0 || price[1] !== Number.MAX_SAFE_INTEGER)
    activeChips.push({
      label: `${(price[0] / 1_000_000).toFixed(1)}tr - ${((price[1] === Number.MAX_SAFE_INTEGER ? maxTourPrice : price[1]) / 1_000_000).toFixed(1)}tr`,
      onClear: () => setPrice([0, Number.MAX_SAFE_INTEGER]),
    });
  types.forEach((t) =>
    activeChips.push({ label: t, onClear: () => setTypes(types.filter((x) => x !== t)) }),
  );
  stars.forEach((s) =>
    activeChips.push({
      label: `${s} sao`,
      onClear: () => setStars(stars.filter((x) => x !== s)),
    }),
  );
  durations.forEach((d) =>
    activeChips.push({
      label: d,
      onClear: () => setDurations(durations.filter((x) => x !== d)),
    }),
  );
  if (minRating > 0)
    activeChips.push({ label: `Từ ${minRating}★`, onClear: () => setMinRating(0) });
  if (depart !== "any") {
    const d = departOptions.find((o) => o.value === depart);
    if (d) activeChips.push({ label: d.label, onClear: () => setDepart("any") });
  }

  const FilterContent = (
    <div className="space-y-6">
      <div>
        <Label className="mb-2 block">Tìm theo tên</Label>
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Phú Quốc, Đà Lạt..."
        />
      </div>

      <div>
        <Label className="mb-2 block">Địa điểm</Label>
        <Select
          value={destination}
          onValueChange={(v) => {
            setDestination(v);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả địa điểm</SelectItem>
            {destinations.map((d) => (
              <SelectItem key={d.slug} value={d.name}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block">Thời gian khởi hành</Label>
        <Select
          value={depart}
          onValueChange={(v) => {
            setDepart(v);
            setPage(1);
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {departOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block">Khoảng giá (VND)</Label>
        <Slider
          min={0}
          max={maxTourPrice}
          step={500_000}
          value={sliderPrice}
          onValueChange={(v) => {
            setPrice(v as [number, number]);
            setPage(1);
          }}
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{price[0].toLocaleString("vi-VN")}</span>
          <span>{sliderPrice[1].toLocaleString("vi-VN")}</span>
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Số ngày</Label>
        <div className="space-y-2">
          {durationOptions.map((d) => (
            <label key={d.label} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={durations.includes(d.label)}
                onCheckedChange={(c) => {
                  setDurations(
                    c ? [...durations, d.label] : durations.filter((x) => x !== d.label),
                  );
                  setPage(1);
                }}
              />
              {d.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Loại tour</Label>
        <div className="space-y-2">
          {tourTypes.map((t) => (
            <label key={t} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={types.includes(t)}
                onCheckedChange={(c) => {
                  setTypes(c ? [...types, t] : types.filter((x) => x !== t));
                  setPage(1);
                }}
              />
              {t}
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Số sao khách sạn</Label>
        <div className="space-y-2">
          {[5, 4, 3].map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={stars.includes(s)}
                onCheckedChange={(c) => {
                  setStars(c ? [...stars, s] : stars.filter((x) => x !== s));
                  setPage(1);
                }}
              />
              <span className="text-amber-500">
                {"★".repeat(s)}
                <span className="text-muted-foreground/40">{"★".repeat(5 - s)}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Đánh giá tối thiểu</Label>
        <div className="flex gap-2 flex-wrap">
          {[0, 4.0, 4.5, 4.8].map((r) => (
            <Button
              key={r}
              size="sm"
              variant={minRating === r ? "default" : "outline"}
              onClick={() => {
                setMinRating(r);
                setPage(1);
              }}
            >
              {r === 0 ? "Tất cả" : `${r}★+`}
            </Button>
          ))}
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={resetAll}>
        Đặt lại bộ lọc
      </Button>
    </div>
  );

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-bold font-heading">Tìm tour du lịch</h1>
        <p className="text-muted-foreground mt-2">
          Lọc theo giá, thời gian, số ngày, loại tour, số sao và đánh giá.
        </p>

        <div className="grid lg:grid-cols-[300px_1fr] gap-8 mt-8">
          <aside className="hidden lg:block">
            <Card className="p-6 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <div className="flex items-center gap-2 mb-4 font-semibold">
                <Filter className="h-4 w-4" />
                Bộ lọc
              </div>
              {FilterContent}
            </Card>
          </aside>

          <div>
            <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
              <div className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{filtered.length}</span> tour phù hợp
              </div>
              <div className="flex items-center gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <SlidersHorizontal className="h-4 w-4 mr-1" />
                      Lọc
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 overflow-y-auto p-6">
                    {FilterContent}
                  </SheetContent>
                </Sheet>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Phổ biến nhất</SelectItem>
                    <SelectItem value="price-asc">Giá thấp → cao</SelectItem>
                    <SelectItem value="price-desc">Giá cao → thấp</SelectItem>
                    <SelectItem value="rating">Đánh giá cao</SelectItem>
                    <SelectItem value="duration-asc">Số ngày ít → nhiều</SelectItem>
                    <SelectItem value="duration-desc">Số ngày nhiều → ít</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {activeChips.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeChips.map((c, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="gap-1 pl-3 pr-1.5 py-1 cursor-pointer"
                    onClick={c.onClear}
                  >
                    {c.label}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
                <button
                  className="text-xs text-primary hover:underline ml-1"
                  onClick={resetAll}
                >
                  Xóa tất cả
                </button>
              </div>
            )}

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {pageItems.map((t) => (
                <TourCard key={t.id} tour={t} />
              ))}
            </div>

            {filtered.length === 0 && (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground mb-4">
                  Không có tour phù hợp với bộ lọc của bạn.
                </p>
                <Button variant="outline" onClick={resetAll}>
                  Đặt lại bộ lọc
                </Button>
              </Card>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={safePage === 1}
                  onClick={() => setPage(safePage - 1)}
                >
                  Trước
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={safePage === i + 1 ? "default" : "outline"}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={safePage === totalPages}
                  onClick={() => setPage(safePage + 1)}
                >
                  Sau
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
