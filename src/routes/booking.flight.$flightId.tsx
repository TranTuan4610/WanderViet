import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BookingFlow } from "@/components/site/BookingFlow";
import { SeatMap } from "@/components/site/SeatMap";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTodayDateInputValue, isFlightDepartingMoreThanOneHourFromNow, isPastDateValue } from "@/lib/dateGuards";
import { flights, formatVND, type Flight } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";

const SEAT_FEE = 50_000; // VND per seat for non-business passengers

export const Route = createFileRoute("/booking/flight/$flightId")({
  component: FlightBookingPage,
  loader: async ({ params }): Promise<{ flight: Flight }> => {
    const cached = flights.find((f) => f.id === params.flightId);
    if (cached) return { flight: cached };
    const { data } = await supabase.from("flights").select("*").eq("id", params.flightId).maybeSingle();
    if (!data) throw notFound();
    return {
      flight: {
        id: data.id, airline: data.airline,
        from: data.from_code, to: data.to_code,
        depart: data.depart, arrive: data.arrive,
        duration: data.duration ?? "", price: Number(data.price),
        baggage: data.baggage ?? "",
      },
    };
  },
});

function FlightBookingPage() {
  const { flight } = Route.useLoaderData() as { flight: Flight };
  const [date, setDate] = useState("");
  const [pax, setPax] = useState(1);
  const [cls, setCls] = useState<"eco" | "premium" | "business">("eco");
  const [seats, setSeats] = useState<string[]>([]);
  const today = getTodayDateInputValue();

  useEffect(() => { setSeats([]); }, [cls, pax]);

  const multiplier = cls === "business" ? 2.5 : cls === "premium" ? 1.5 : 1;
  const baseTotal = Math.round(flight.price * multiplier) * pax;
  const seatFee = cls === "business" ? 0 : seats.length * SEAT_FEE;
  const total = baseTotal + seatFee;

  return (
    <SiteLayout>
      <BookingFlow
        title="Đặt vé máy bay"
        subtitle={`${flight.airline} · ${flight.from} → ${flight.to}`}
        total={total}
        orderInfo={`FLIGHT ${flight.id.toUpperCase()} x${pax}`}
        bookingType="flight"
        refId={flight.id}
        refTitle={`${flight.airline} ${flight.from}→${flight.to}`}
        extraInfo={{ date, pax, class: cls, seats, seat_fee: seatFee }}
        guestCount={pax}
        validateStep0={() => {
          if (!date) return "Vui lòng chọn ngày bay";
          if (isPastDateValue(date, today)) return "Ngày bay không thể ở quá khứ";
          if (!isFlightDepartingMoreThanOneHourFromNow(date, flight.depart)) return "Chuyến bay này đã sát giờ, vui lòng chọn chuyến khác";
          if (cls === "business" && seats.length !== pax) return `Hạng thương gia: vui lòng chọn đủ ${pax} ghế (miễn phí)`;
          if (seats.length > 0 && seats.length !== pax) return `Vui lòng chọn đủ ${pax} ghế hoặc bỏ chọn hết để hệ thống tự xếp`;
          return null;
        }}
        step0={
          <div className="space-y-5">
            <h2 className="font-semibold text-lg">Chọn ngày bay & hành khách</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label className="mb-2 block">Ngày bay</Label><Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div>
                <Label className="mb-2 block">Số hành khách (tối thiểu 1)</Label>
                <Input type="number" min={1} max={9} value={pax}
                  onChange={(e) => setPax(Math.max(1, Math.min(9, +e.target.value || 1)))} />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-2 block">Hạng vé</Label>
                <Select value={cls} onValueChange={(v) => setCls(v as typeof cls)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eco">Phổ thông</SelectItem>
                    <SelectItem value="premium">Phổ thông đặc biệt (+50%)</SelectItem>
                    <SelectItem value="business">Thương gia (+150%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <h3 className="font-semibold">Sơ đồ ghế ({seats.length}/{pax})</h3>
                <p className="text-xs text-muted-foreground">
                  {cls === "business"
                    ? "Thương gia: chọn ghế miễn phí"
                    : `Chọn ghế: +${formatVND(SEAT_FEE)}/ghế (không bắt buộc — bỏ trống để hệ thống tự xếp)`}
                </p>
              </div>
              <SeatMap
                seed={`${flight.id}-${date || "any"}`}
                cls={cls}
                capacity={pax}
                selected={seats}
                onChange={setSeats}
              />
              {seats.length > 0 && (
                <p className="text-sm">Ghế đã chọn: <b>{seats.join(", ")}</b></p>
              )}
            </div>
          </div>
        }
        summary={
          <>
            <div className="rounded-lg border p-3 mb-3">
              <p className="font-medium text-sm">{flight.airline}</p>
              <div className="flex items-center justify-between mt-2 text-sm">
                <div className="text-center"><p className="font-bold">{flight.depart}</p><p className="text-xs text-muted-foreground">{flight.from}</p></div>
                <p className="text-xs text-muted-foreground">{flight.duration}</p>
                <div className="text-center"><p className="font-bold">{flight.arrive}</p><p className="text-xs text-muted-foreground">{flight.to}</p></div>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Giá/khách</span><span>{formatVND(Math.round(flight.price * multiplier))}</span></div>
              <div className="flex justify-between"><span>Hành khách</span><span>{pax}</span></div>
              <div className="flex justify-between"><span>Hành lý</span><span>{flight.baggage}</span></div>
              {seatFee > 0 && (
                <div className="flex justify-between"><span>Phí chọn ghế ({seats.length})</span><span>{formatVND(seatFee)}</span></div>
              )}
              {cls === "business" && seats.length > 0 && (
                <div className="flex justify-between text-emerald-600"><span>Chọn ghế thương gia</span><span>Miễn phí</span></div>
              )}
            </div>
          </>
        }
      />
    </SiteLayout>
  );
}
