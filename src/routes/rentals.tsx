import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bike, Car, MapPin, CalendarDays } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { rentalLocations, useRentalsVersion, type Vehicle } from "@/lib/rentalData";
import { useLanguage } from "@/lib/i18n";


export const Route = createFileRoute("/rentals")({
  head: () => ({
    meta: [
      { title: "Thuê xe máy & ô tô theo ngày — WanderViet" },
      { name: "description", content: "Thuê xe máy và ô tô tự lái theo ngày tại các điểm đến phổ biến: Hà Nội, Đà Nẵng, Hội An, Nha Trang, Đà Lạt, Phú Quốc..." },
      { property: "og:title", content: "Thuê xe máy & ô tô theo ngày — WanderViet" },
      { property: "og:description", content: "Hơn 160 phương tiện sẵn sàng tại 8 điểm đến. Đặt nhanh, giá theo ngày." },
    ],
  }),
  component: RentalsPage,
});

const fmt = (n: number) => n.toLocaleString("vi-VN") + "đ";

function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function RentalsPage() {
  useRentalsVersion();
  const { t } = useLanguage();
  const [locationSlug, setLocationSlug] = useState(rentalLocations[0].slug);
  const [pickup, setPickup] = useState(todayISO(1));
  const [dropoff, setDropoff] = useState(todayISO(3));
  const [tab, setTab] = useState<"motorbike" | "car">("motorbike");

  const location = useMemo(
    () => rentalLocations.find((l) => l.slug === locationSlug)!,
    [locationSlug],
  );

  const days = useMemo(() => {
    const a = new Date(pickup).getTime();
    const b = new Date(dropoff).getTime();
    const d = Math.ceil((b - a) / 86_400_000);
    return d > 0 ? d : 1;
  }, [pickup, dropoff]);

  const list = location.vehicles.filter((v) => v.type === tab);

  return (
    <SiteLayout>
      <section className="bg-gradient-to-br from-primary/10 via-background to-accent/20 border-b">
        <div className="container mx-auto px-4 py-10">
          <h1 className="text-3xl md:text-4xl font-heading font-bold tracking-tight">
            {t("rentals.heading")}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            {t("rentals.subtitle")}
          </p>

          <Card className="mt-6">
            <CardContent className="grid gap-4 p-4 md:grid-cols-4">
              <div>
                <Label className="mb-1.5 flex items-center gap-1 text-xs"><MapPin className="h-3.5 w-3.5" /> {t("rentals.location")}</Label>
                <Select value={locationSlug} onValueChange={setLocationSlug}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {rentalLocations.map((l) => (
                      <SelectItem key={l.slug} value={l.slug}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 flex items-center gap-1 text-xs"><CalendarDays className="h-3.5 w-3.5" /> {t("rentals.pickup")}</Label>
                <Input type="date" value={pickup} min={todayISO()} onChange={(e) => setPickup(e.target.value)} />
              </div>
              <div>
                <Label className="mb-1.5 flex items-center gap-1 text-xs"><CalendarDays className="h-3.5 w-3.5" /> {t("rentals.dropoff")}</Label>
                <Input type="date" value={dropoff} min={pickup} onChange={(e) => setDropoff(e.target.value)} />
              </div>
              <div className="flex items-end">
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm w-full">
                  {t("rentals.daysCount")}: <span className="font-semibold">{days}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "motorbike" | "car")}>
          <TabsList>
            <TabsTrigger value="motorbike" className="gap-2"><Bike className="h-4 w-4" /> {t("rentals.motorbikeN", { n: 10 })}</TabsTrigger>
            <TabsTrigger value="car" className="gap-2"><Car className="h-4 w-4" /> {t("rentals.carN", { n: 10 })}</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {list.map((v) => (
                <VehicleCard key={v.id} v={v} days={days} locationSlug={location.slug} pickup={pickup} dropoff={dropoff} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </SiteLayout>
  );
}

function VehicleCard({ v, days, locationSlug, pickup, dropoff }: { v: Vehicle; days: number; locationSlug: string; pickup: string; dropoff: string }) {
  const { t } = useLanguage();
  const total = v.pricePerDay * days;
  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        <img src={v.image} alt={`${v.brand} ${v.name}`} loading="lazy" className="h-full w-full object-cover transition-transform hover:scale-105" />
      </div>
      <CardContent className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs text-muted-foreground">{v.brand}</div>
            <h3 className="font-semibold leading-tight">{v.name}</h3>
          </div>
          <Badge variant="secondary">{v.type === "motorbike" ? t("rentals.motorbike") : t("rentals.car")}</Badge>
        </div>
        {v.type === "car" && (
          <div className="text-xs text-muted-foreground">
            {t("rentals.seats", { n: v.seats ?? 4 })} • {v.transmission === "auto" ? t("rentals.auto") : t("rentals.manual")}
          </div>
        )}
        <div className="mt-auto pt-2 flex items-end justify-between">
          <div>
            <div className="text-lg font-bold text-primary">{fmt(v.pricePerDay)}<span className="text-xs font-normal text-muted-foreground">{t("rentals.perDay")}</span></div>
            <div className="text-xs text-muted-foreground">{t("rentals.daysEq", { n: days })} = <span className="font-medium text-foreground">{fmt(total)}</span></div>
          </div>
          <Button size="sm" asChild>
            <Link to="/booking/rental/$vehicleId" params={{ vehicleId: v.id }} search={{ loc: locationSlug, pickup, dropoff }}>
              {t("rentals.book")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
