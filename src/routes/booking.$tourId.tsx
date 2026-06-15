import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BookingFlow } from "@/components/site/BookingFlow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminVersion } from "@/lib/adminStore";
import { getTodayDateInputValue, isPastDateValue } from "@/lib/dateGuards";
import { formatVND, tours, type Tour } from "@/lib/mockData";

export const Route = createFileRoute("/booking/$tourId")({
  component: BookingPage,
});

function BookingPage() {
  useAdminVersion();
  const { tourId } = Route.useParams();
  const tour = tours.find((t) => t.id === tourId) as Tour | undefined;
  const [people, setPeople] = useState(2);
  const [date, setDate] = useState("");
  const today = getTodayDateInputValue();

  if (!tour) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">Đang tải tour...</h1>
          <p className="text-muted-foreground">
            Nếu trang không hiện, hãy thử{" "}
            <Link to="/tours" className="text-primary underline">quay lại danh sách</Link>.
          </p>
        </div>
      </SiteLayout>
    );
  }

  const total = tour.price * people;

  return (
    <SiteLayout>
      <BookingFlow
        title="Đặt tour"
        subtitle={tour.title}
        total={total}
        orderInfo={`TOUR ${tour.id.toUpperCase()} x${people}`}
        bookingType="tour"
        refId={tour.id}
        refTitle={tour.title}
        extraInfo={{ date, people }}
        guestCount={people}
        validateStep0={() => {
          if (!date) return "Vui lòng chọn ngày khởi hành";
          if (isPastDateValue(date, today)) return "Ngày khởi hành không thể ở quá khứ";
          return null;
        }}
        step0={
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">Chọn ngày & số người</h2>
            <div>
              <Label className="mb-2 block">Ngày khởi hành *</Label>
              <Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label className="mb-2 block">Số người (tối thiểu 1)</Label>
              <Input type="number" min={1} value={people} onChange={(e) => setPeople(Math.max(1, +e.target.value || 1))} />
            </div>
          </div>
        }
        summary={
          <>
            <img src={tour.image} alt={tour.title} className="rounded-lg w-full h-32 object-cover mb-3" />
            <p className="font-medium text-sm">{tour.title}</p>
            <p className="text-xs text-muted-foreground">{tour.days}N{tour.nights}Đ · {tour.destination}</p>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>Giá/khách</span><span>{formatVND(tour.price)}</span></div>
              <div className="flex justify-between"><span>Số khách</span><span>{people}</span></div>
            </div>
          </>
        }
      />
    </SiteLayout>
  );
}
