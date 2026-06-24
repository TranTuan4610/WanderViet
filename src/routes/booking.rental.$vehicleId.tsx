import { createFileRoute, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BookingFlow } from "@/components/site/BookingFlow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { rentalLocations, type Vehicle, type RentalLocation } from "@/lib/rentalData";
import { formatVND } from "@/lib/mockData";
import { getTodayDateInputValue, isPastDateValue } from "@/lib/dateGuards";
import { useMemo, useState } from "react";

const searchSchema = z.object({
  loc: z.string().optional(),
  pickup: z.string().optional(),
  dropoff: z.string().optional(),
});

export const Route = createFileRoute("/booking/rental/$vehicleId")({
  validateSearch: (s) => searchSchema.parse(s),
  loaderDeps: ({ search }) => ({ loc: search.loc }),
  loader: ({ params, deps }): { vehicle: Vehicle; location: RentalLocation } => {
    let location: RentalLocation | undefined;
    let vehicle: Vehicle | undefined;
    if (deps.loc) {
      location = rentalLocations.find((l) => l.slug === deps.loc);
      vehicle = location?.vehicles.find((v) => v.id === params.vehicleId);
    }
    if (!vehicle) {
      for (const l of rentalLocations) {
        const v = l.vehicles.find((vh) => vh.id === params.vehicleId);
        if (v) { location = l; vehicle = v; break; }
      }
    }
    if (!vehicle || !location) throw notFound();
    return { vehicle, location };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `Đặt thuê ${loaderData?.vehicle.brand ?? ""} ${loaderData?.vehicle.name ?? ""} — WanderViet` },
    ],
  }),
  component: RentalBookingPage,
});

function todayISO(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function RentalBookingPage() {
  const { vehicle, location } = Route.useLoaderData();
  const search = Route.useSearch();
  const today = getTodayDateInputValue();

  const [pickup, setPickup] = useState(search.pickup || todayISO(1));
  const [dropoff, setDropoff] = useState(search.dropoff || todayISO(3));
  const [pickupTime, setPickupTime] = useState("09:00");
  const [licenseNo, setLicenseNo] = useState("");

  const days = useMemo(() => {
    const a = new Date(pickup).getTime();
    const b = new Date(dropoff).getTime();
    const d = Math.ceil((b - a) / 86_400_000);
    return d > 0 ? d : 1;
  }, [pickup, dropoff]);

  const total = vehicle.pricePerDay * days;

  return (
    <SiteLayout>
      <BookingFlow
        title="Đặt thuê xe"
        subtitle={`${vehicle.brand} ${vehicle.name} · ${location.name}`}
        total={total}
        orderInfo={`RENTAL ${vehicle.id.toUpperCase()} ${days}d`}
        bookingType="rental"
        refId={vehicle.id}
        refTitle={`${vehicle.brand} ${vehicle.name} (${location.name})`}
        extraInfo={{
          location: location.name,
          location_slug: location.slug,
          pickup,
          dropoff,
          pickup_time: pickupTime,
          days,
          price_per_day: vehicle.pricePerDay,
          vehicle_type: vehicle.type,
          license_no: licenseNo,
        }}
        guestCount={1}
        validateStep0={() => {
          if (!pickup || !dropoff) return "Vui lòng chọn ngày nhận và trả xe";
          if (isPastDateValue(pickup, today)) return "Ngày nhận xe không thể ở quá khứ";
          if (new Date(dropoff).getTime() <= new Date(pickup).getTime())
            return "Ngày trả phải sau ngày nhận";
          if (!licenseNo.trim() || licenseNo.trim().length < 6)
            return "Vui lòng nhập số bằng lái xe (tối thiểu 6 ký tự)";
          return null;
        }}
        step0={
          <div className="space-y-5">
            <h2 className="font-semibold text-lg">Chi tiết thuê xe</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Ngày nhận xe</Label>
                <Input type="date" min={today} value={pickup} onChange={(e) => setPickup(e.target.value)} />
              </div>
              <div>
                <Label className="mb-2 block">Ngày trả xe</Label>
                <Input type="date" min={pickup} value={dropoff} onChange={(e) => setDropoff(e.target.value)} />
              </div>
              <div>
                <Label className="mb-2 block">Giờ nhận xe</Label>
                <Select value={pickupTime} onValueChange={setPickupTime}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 13 }, (_, i) => 7 + i).map((h) => (
                      <SelectItem key={h} value={`${String(h).padStart(2, "0")}:00`}>
                        {String(h).padStart(2, "0")}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Số bằng lái xe</Label>
                <Input
                  placeholder="Nhập số GPLX"
                  value={licenseNo}
                  onChange={(e) => setLicenseNo(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Lưu ý: Vui lòng mang theo CCCD và GPLX gốc khi nhận xe. Đặt cọc tại điểm nhận theo quy định.
            </p>
          </div>
        }
        summary={
          <>
            <div className="rounded-lg border p-3 mb-3">
              <img src={vehicle.image} alt="" className="w-full aspect-[4/3] object-cover rounded mb-2" loading="lazy" />
              <p className="font-medium text-sm">{vehicle.brand} {vehicle.name}</p>
              <p className="text-xs text-muted-foreground">{location.name}</p>
              {vehicle.type === "car" && (
                <p className="text-xs text-muted-foreground">
                  {vehicle.seats} chỗ • {vehicle.transmission === "auto" ? "Số tự động" : "Số sàn"}
                </p>
              )}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Giá/ngày</span><span>{formatVND(vehicle.pricePerDay)}</span></div>
              <div className="flex justify-between"><span>Số ngày thuê</span><span>{days}</span></div>
              <div className="flex justify-between"><span>Nhận xe</span><span>{pickup} {pickupTime}</span></div>
              <div className="flex justify-between"><span>Trả xe</span><span>{dropoff}</span></div>
            </div>
          </>
        }
      />
    </SiteLayout>
  );
}
