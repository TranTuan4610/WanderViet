import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BookingFlow } from "@/components/site/BookingFlow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTodayDateInputValue, isFlightDepartingMoreThanOneHourFromNow, isPastDateValue } from "@/lib/dateGuards";
import { flights, formatVND, type Flight } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/booking/flight/$flightId")({
  component: FlightBookingPage,
  loader: async ({ params }): Promise<{ flight: Flight }> => {
    const { data } = await supabase.from("flights").select("*").eq("id", params.flightId).maybeSingle();
    if (data) {
      const flight = {
        id: data.id, airline: data.airline,
        from: data.from_code, to: data.to_code,
        depart: data.depart, arrive: data.arrive,
        duration: data.duration ?? "", price: Number(data.price),
        baggage: data.baggage ?? "",
      };
      const idx = flights.findIndex((f) => f.id === flight.id);
      if (idx >= 0) flights[idx] = flight;
      else flights.unshift(flight);
      return { flight };
    }
    const cached = flights.find((f) => f.id === params.flightId);
    if (cached) return { flight: cached };
    throw notFound();
  },
});

function FlightBookingPage() {
  const { flight } = Route.useLoaderData() as { flight: Flight };
  const [date, setDate] = useState("");
  const [pax, setPax] = useState(1);
  const [cls, setCls] = useState("eco");
  const today = getTodayDateInputValue();

  const multiplier = cls === "business" ? 2.5 : cls === "premium" ? 1.5 : 1;
  const total = Math.round(flight.price * multiplier) * pax;

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
        extraInfo={{ date, pax, class: cls }}
        guestCount={pax}
        validateStep0={() => {
          if (!date) return "Vui lòng chọn ngày bay";
          if (isPastDateValue(date, today)) return "Ngày bay không thể ở quá khứ";
          if (!isFlightDepartingMoreThanOneHourFromNow(date, flight.depart)) return "Chuyến bay này đã sát giờ, vui lòng chọn chuyến khác";
          return null;
        }}
        step0={
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Chọn ngày bay & hành khách</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label className="mb-2 block">Ngày bay</Label><Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div>
                <Label className="mb-2 block">Số hành khách (tối thiểu 1)</Label>
                <Input type="number" min={1} value={pax}
                  onChange={(e) => setPax(Math.max(1, +e.target.value || 1))} />
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-2 block">Hạng vé</Label>
                <Select value={cls} onValueChange={setCls}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eco">Phổ thông</SelectItem>
                    <SelectItem value="premium">Phổ thông đặc biệt (+50%)</SelectItem>
                    <SelectItem value="business">Thương gia (+150%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            </div>
          </>
        }
      />
    </SiteLayout>
  );
}
