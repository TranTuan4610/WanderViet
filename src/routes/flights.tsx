import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Briefcase, Plane } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getTodayDateInputValue, isFlightDepartingMoreThanOneHourFromNow, isPastDateValue } from "@/lib/dateGuards";
import { airports, flights, formatVND, type Flight } from "@/lib/mockData";
import { useAdminVersion } from "@/lib/adminStore";
import { z } from "zod";

export const Route = createFileRoute("/flights")({
  component: FlightsPage,
  validateSearch: z.object({ combo: z.string().optional() }),
});

function FlightsPage() {
  const adminVersion = useAdminVersion();
  const { combo } = Route.useSearch();
  const [tripType, setTripType] = useState<"oneway" | "round">("oneway");
  const [from, setFrom] = useState("HAN");
  const [to, setTo] = useState("SGN");
  const [airline, setAirline] = useState("all");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [pax, setPax] = useState(1);
  const [addHotel, setAddHotel] = useState(combo === "hotel");
  const [hotelLocation, setHotelLocation] = useState<"from" | "to">("to");
  const [submitted, setSubmitted] = useState(0);
  const today = getTodayDateInputValue();
  const searchDepartDate = isPastDateValue(departDate, today) ? today : departDate || today;
  const searchReturnDate = isPastDateValue(returnDate, today) ? today : returnDate || departDate || today;

  const outbound = useMemo(() => filter(flights, from, to, airline, searchDepartDate), [from, to, airline, searchDepartDate, submitted, adminVersion]);
  const inbound = useMemo(
    () => (tripType === "round" ? filter(flights, to, from, airline, searchReturnDate) : []),
    [tripType, from, to, airline, searchReturnDate, submitted, adminVersion],
  );

  const sortedAirports = [...airports].sort((a, b) => a.city.localeCompare(b.city));
  const reachableTo = sortedAirports.filter((a) => a.code !== from && flights.some((f) => f.from === from && f.to === a.code));
  useEffect(() => {
    if (reachableTo.length > 0 && !reachableTo.some((a) => a.code === to)) setTo(reachableTo[0].code);
  }, [from]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SiteLayout>
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-bold font-heading">Vé máy bay</h1>
        <p className="text-muted-foreground mt-2">So sánh giá từ tất cả các hãng bay</p>

        {combo === "hotel" && (
          <Card className="p-4 mt-4 border-primary/40 bg-primary/5">
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Ưu đãi Combo Bay + Khách sạn — Tiết kiệm tới 30%</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Đặt vé máy bay kèm khách sạn tại điểm đến hoặc điểm đi để hưởng giá combo ưu đãi.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={addHotel} onChange={(e) => setAddHotel(e.target.checked)} />
                    Thêm khách sạn vào combo
                  </label>
                  {addHotel && (
                    <>
                      <RadioGroup
                        value={hotelLocation}
                        onValueChange={(v) => setHotelLocation(v as "from" | "to")}
                        className="flex gap-4"
                      >
                        <Label className="flex items-center gap-1.5 cursor-pointer text-sm">
                          <RadioGroupItem value="to" /> Tại điểm đến ({to})
                        </Label>
                        <Label className="flex items-center gap-1.5 cursor-pointer text-sm">
                          <RadioGroupItem value="from" /> Tại điểm đi ({from})
                        </Label>
                      </RadioGroup>
                      <Button asChild size="sm" variant="outline">
                        <a href={`/hotels?city=${encodeURIComponent(hotelLocation === "to" ? to : from)}`}>
                          Chọn khách sạn <ArrowRight className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6 mt-6">
          <RadioGroup
            value={tripType}
            onValueChange={(v) => setTripType(v as "oneway" | "round")}
            className="flex gap-6 mb-4"
          >
            <Label className="flex items-center gap-2 cursor-pointer">
              <RadioGroupItem value="oneway" /> Một chiều
            </Label>
            <Label className="flex items-center gap-2 cursor-pointer">
              <RadioGroupItem value="round" /> Khứ hồi
            </Label>
          </RadioGroup>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isPastDateValue(departDate, today)) setDepartDate(today);
              if (tripType === "round" && isPastDateValue(returnDate, today)) setReturnDate(today);
              setSubmitted((n) => n + 1);
            }}
            className={`grid gap-3 ${tripType === "round" ? "md:grid-cols-6" : "md:grid-cols-5"}`}
          >
            <div>
              <Label className="mb-2 block">Điểm đi</Label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {sortedAirports.map((a) => <SelectItem key={a.code} value={a.code}>{a.city} ({a.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Điểm đến</Label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger><SelectValue placeholder="Chọn điểm đến" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {reachableTo.length === 0 ? (
                    <div className="px-2 py-2 text-sm text-muted-foreground">Không có chuyến từ điểm đi này</div>
                  ) : reachableTo.map((a) => <SelectItem key={a.code} value={a.code}>{a.city} ({a.code})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Ngày đi</Label>
              <Input type="date" min={today} value={departDate} onChange={(e) => setDepartDate(e.target.value)} />
            </div>
            {tripType === "round" && (
              <div>
                <Label className="mb-2 block">Ngày về</Label>
                <Input type="date" min={departDate || today} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
              </div>
            )}
            <div>
              <Label className="mb-2 block">Hãng bay</Label>
              <Select value={airline} onValueChange={setAirline}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="Vietnam Airlines">Vietnam Airlines</SelectItem>
                  <SelectItem value="Vietjet Air">Vietjet Air</SelectItem>
                  <SelectItem value="Bamboo Airways">Bamboo Airways</SelectItem>
                  <SelectItem value="Vietravel Airlines">Vietravel Airlines</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end"><Button type="submit" className="w-full">Tìm vé</Button></div>
          </form>

          <div className="mt-3">
            <Label className="mb-2 block">Số hành khách (tối thiểu 1)</Label>
            <Input type="number" min={1} className="max-w-[160px]" value={pax}
              onChange={(e) => setPax(Math.max(1, +e.target.value || 1))} />
          </div>
        </Card>

        <FlightSegment title="Chuyến đi" list={outbound} pax={pax} />
        {tripType === "round" && <FlightSegment title="Chuyến về" list={inbound} pax={pax} />}
      </div>
    </SiteLayout>
  );
}

function filter(list: Flight[], from: string, to: string, airline: string, selectedDate: string) {
  return list.filter((f) =>
    f.from === from &&
    f.to === to &&
    (airline === "all" || f.airline === airline) &&
    isFlightDepartingMoreThanOneHourFromNow(selectedDate, f.depart),
  );
}

function FlightSegment({ title, list, pax }: { title: string; list: Flight[]; pax: number }) {
  return (
    <div className="mt-8">
      <h2 className="font-heading font-bold text-xl mb-4">{title} <span className="text-sm font-normal text-muted-foreground">({list.length} chuyến)</span></h2>
      {list.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">Không tìm thấy chuyến bay phù hợp.</Card>
      ) : (
        <div className="space-y-4">
          {list.map((f) => (
            <Card key={f.id} className="p-5 hover:shadow-lg transition">
              <div className="grid md:grid-cols-[1fr_2fr_1fr_auto] gap-6 items-center">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 inline-flex items-center justify-center"><Plane className="h-5 w-5 text-primary" /></div>
                  <p className="font-medium text-sm">{f.airline}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold font-heading">{f.depart}</p>
                    <p className="text-xs text-muted-foreground">{f.from}</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-xs text-muted-foreground">{f.duration}</p>
                    <div className="border-t border-dashed my-1 relative"><ArrowRight className="h-3 w-3 inline absolute -top-1.5 right-0 text-muted-foreground" /></div>
                    <p className="text-xs text-muted-foreground">Bay thẳng</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold font-heading">{f.arrive}</p>
                    <p className="text-xs text-muted-foreground">{f.to}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1"><Briefcase className="h-3 w-3" />{f.baggage}</div>
                <div className="text-right">
                  <p className="text-primary text-xl font-bold">{formatVND(f.price * pax)}</p>
                  <p className="text-xs text-muted-foreground">{pax} khách</p>
                  <Button size="sm" className="mt-2" asChild>
                    <Link to="/booking/flight/$flightId" params={{ flightId: f.id }}>Chọn</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
