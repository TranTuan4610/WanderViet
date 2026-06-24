import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, Star, Wifi } from "lucide-react";
import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminVersion } from "@/lib/adminStore";
import { getTodayDateInputValue } from "@/lib/dateGuards";
import { formatVND, hotels } from "@/lib/mockData";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/hotels/")({ component: HotelsPage });

function HotelsPage() {
  useAdminVersion();
  const { t } = useLanguage();
  const [city, setCity] = useState("");
  const [focused, setFocused] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const today = getTodayDateInputValue();

  const cityOptions = useMemo(() => [...new Set(hotels.map((h) => h.city))], []);
  const suggestions = useMemo(() => {
    const q = city.trim().toLowerCase();
    if (!q) return cityOptions.slice(0, 8);
    return cityOptions.filter((c) => c.toLowerCase().includes(q)).slice(0, 8);
  }, [city, cityOptions]);

  const list = useMemo(() => {
    const q = city.trim().toLowerCase();
    if (!q) return hotels;
    return hotels.filter(
      (h) =>
        h.city.toLowerCase().includes(q) ||
        h.name.toLowerCase().includes(q) ||
        (h.address ?? "").toLowerCase().includes(q),
    );
  }, [city]);

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-bold font-heading">{t("hotels.title")}</h1>
        <p className="text-muted-foreground mt-2">{t("hotels.subtitle")}</p>

        <Card className="p-6 mt-6">
          <div className="grid md:grid-cols-5 gap-3">
            <div className="relative">
              <Label className="mb-2 block">{t("hotels.location")}</Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                placeholder={t("hotels.locationPlaceholder")}
              />
              {focused && suggestions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setCity(c);
                        setFocused(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2"
                    >
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label className="mb-2 block">{t("hotels.checkIn")}</Label>
              <Input type="date" min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div>
              <Label className="mb-2 block">{t("hotels.checkOut")}</Label>
              <Input type="date" min={checkIn || today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
            <div>
              <Label className="mb-2 block">{t("hotels.guests")}</Label>
              <Input type="number" min={1} step={1} defaultValue={2} placeholder={t("hotels.guests")} />
            </div>
            <div className="flex items-end">
              <Button className="w-full">{t("hotels.search")}</Button>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {list.map((h) => (
            <Card key={h.id} className="overflow-hidden hover:shadow-xl transition pt-0 gap-0 pb-0">
              <Link to="/hotels/$hotelId" params={{ hotelId: h.id }}>
                <img
                  src={h.image}
                  alt={h.name}
                  loading="lazy"
                  className="h-48 w-full object-cover"
                />
              </Link>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-amber-500 text-sm">{"★".repeat(h.stars)}</span>
                  <span className="text-sm flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {h.rating}
                  </span>
                </div>
                <Link to="/hotels/$hotelId" params={{ hotelId: h.id }}>
                  <h3 className="font-heading font-semibold text-lg mt-2 hover:text-primary transition">
                    {h.name}
                  </h3>
                </Link>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {h.address}
                </p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {h.amenities.slice(0, 3).map((a) => (
                    <span
                      key={a}
                      className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
                    >
                      <Wifi className="h-3 w-3 inline mr-1" />
                      {a}
                    </span>
                  ))}
                </div>
                <div className="flex items-end justify-between mt-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">{t("common.from")}</p>
                    <p className="text-primary text-xl font-bold">{formatVND(h.price)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" asChild>
                      <Link to="/hotels/$hotelId" params={{ hotelId: h.id }}>
                        {t("common.view")}
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link to="/booking/hotel/$hotelId" params={{ hotelId: h.id }}>
                        {t("common.book")}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
