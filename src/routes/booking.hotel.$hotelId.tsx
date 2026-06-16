import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BookingFlow } from "@/components/site/BookingFlow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getTodayDateInputValue, isPastDateValue } from "@/lib/dateGuards";
import { formatVND, hotels, type Hotel } from "@/lib/mockData";
import { fetchHotelWithRooms } from "@/lib/hotelSupabase";

export const Route = createFileRoute("/booking/hotel/$hotelId")({
  component: HotelBookingPage,
  validateSearch: (s: Record<string, unknown>) => ({ roomId: (s.roomId as string) ?? "" }),
  loader: async ({ params }): Promise<{ hotel: Hotel }> => {
    const fresh = await fetchHotelWithRooms(params.hotelId);
    if (fresh) {
      const idx = hotels.findIndex((h) => h.id === fresh.id);
      if (idx >= 0) hotels[idx] = fresh;
      else hotels.unshift(fresh);
      return { hotel: fresh };
    }
    const cached = hotels.find((h) => h.id === params.hotelId);
    if (cached) return { hotel: cached };
    throw notFound();
  },
});

function HotelBookingPage() {
  const { hotel } = Route.useLoaderData() as { hotel: Hotel };
  const { roomId } = Route.useSearch();
  const rooms = hotel.rooms ?? [];
  const [selectedRoomId, setSelectedRoomId] = useState(roomId || rooms[0]?.id || "");
  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? rooms[0];

  const today = getTodayDateInputValue();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [rooms_, setRooms] = useState(1);
  const [guests, setGuests] = useState(2);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1;
    const d = (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000;
    return Math.max(1, Math.round(d));
  }, [checkIn, checkOut]);

  const basePeople = selectedRoom?.basePeople ?? hotel.basePeople ?? 2;
  const extraRate = hotel.extraFeeRate ?? 0.25;
  const extraGuests = Math.max(0, guests - basePeople);
  const roomBasePrice = selectedRoom ? Math.round(selectedRoom.basePrice ?? hotel.price * selectedRoom.priceMultiplier) : hotel.price;
  const pricePerNight = Math.round(roomBasePrice * (1 + extraGuests * extraRate));
  const total = pricePerNight * rooms_ * nights;

  return (
    <SiteLayout>
      <BookingFlow
        title="Đặt khách sạn"
        subtitle={`${hotel.name}${selectedRoom ? ` · ${selectedRoom.name}` : ""}`}
        total={total}
        orderInfo={`HOTEL ${hotel.id.toUpperCase()} ${rooms_}P ${nights}D`}
        bookingType="hotel"
        refId={hotel.id}
        refTitle={`${hotel.name} - ${selectedRoom?.name ?? ""}`}
        extraInfo={{ checkIn, checkOut, rooms: rooms_, guests, nights, pricePerNight, roomId: selectedRoom?.id, roomName: selectedRoom?.name, roomType: selectedRoom?.tier, capacity: selectedRoom?.maxPeople, amenities: selectedRoom?.amenities ?? [], ownerEmail: selectedRoom?.ownerEmail ?? null }}
        guestCount={guests}
        validateStep0={() => {
          if (!checkIn || !checkOut) return "Vui lòng chọn ngày nhận và trả phòng";
          if (isPastDateValue(checkIn, today)) return "Ngày nhận phòng không thể ở quá khứ";
          if (checkOut <= checkIn) return "Ngày trả phòng phải sau ngày nhận phòng";
          return null;
        }}
        step0={
          <div className="space-y-5">
            <div>
              <h2 className="font-semibold text-lg mb-3">Chọn loại phòng</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {rooms.map((r) => {
                  const active = r.id === selectedRoom?.id;
                  const price = Math.round(r.basePrice ?? hotel.price * r.priceMultiplier);
                  return (
                    <button key={r.id} type="button" onClick={() => setSelectedRoomId(r.id)}
                      className={`text-left rounded-xl border-2 p-3 transition-all ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{r.name}</span>
                        {r.tier === "vip" && <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px]">VIP</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{r.beds} giường · {r.basePeople}-{r.maxPeople} khách</p>
                      <p className="text-sm font-bold text-primary mt-1">{formatVND(price)}<span className="text-xs text-muted-foreground font-normal">/đêm</span></p>
                      <p className="text-[11px] text-muted-foreground mt-1">Còn {r.available} phòng</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-3">Ngày & số khách</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label className="mb-2 block">Nhận phòng</Label><Input type="date" min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} /></div>
                <div><Label className="mb-2 block">Trả phòng</Label><Input type="date" min={checkIn || today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} /></div>
                <div>
                  <Label className="mb-2 block">Số phòng</Label>
                  <Input type="number" min={1} max={selectedRoom?.available ?? 99} value={rooms_}
                    onChange={(e) => setRooms(Math.max(1, +e.target.value || 1))} />
                </div>
                <div>
                  <Label className="mb-2 block">Số khách</Label>
                  <Input type="number" min={1} max={(selectedRoom?.maxPeople ?? 4) * rooms_} value={guests}
                    onChange={(e) => setGuests(Math.max(1, +e.target.value || 1))} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Phòng đã gồm {basePeople} khách. Mỗi khách dư +{Math.round(extraRate * 100)}% / đêm.
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
        summary={
          <>
            <img src={hotel.image} alt={hotel.name} className="rounded-lg w-full h-32 object-cover mb-3" />
            <p className="font-medium text-sm">{hotel.name}</p>
            <p className="text-xs text-muted-foreground">{"★".repeat(hotel.stars)} · {hotel.city}</p>
            {selectedRoom && (
              <div className="mt-3 p-2 rounded-lg bg-secondary/50 text-xs">
                <p className="font-semibold">{selectedRoom.name}</p>
                <p className="text-muted-foreground">{selectedRoom.beds} giường · tối đa {selectedRoom.maxPeople} khách</p>
              </div>
            )}
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span>Giá phòng / đêm ({basePeople} khách)</span><span>{formatVND(roomBasePrice)}</span></div>
              {extraGuests > 0 && <div className="flex justify-between"><span>+{extraGuests} khách dư</span><span className="text-primary">+{Math.round(extraGuests * extraRate * 100)}%</span></div>}
              <div className="flex justify-between font-medium"><span>Thực tế / đêm</span><span>{formatVND(pricePerNight)}</span></div>
              <div className="flex justify-between"><span>Số phòng</span><span>{rooms_}</span></div>
              <div className="flex justify-between"><span>Số đêm</span><span>{nights}</span></div>
            </div>
          </>
        }
      />
    </SiteLayout>
  );
}
