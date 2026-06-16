import { supabase } from "@/integrations/supabase/client";
import { explainSupabaseError } from "@/lib/adminErrors";
import { hydrateHotelDetails, type Hotel, type HotelRoom } from "@/lib/mockData";

type HotelRow = {
  id: string;
  name: string;
  address?: string | null;
  city: string;
  price: number | string;
  rating?: number | string | null;
  stars?: number | null;
  image?: string | null;
  check_in?: string | null;
  check_out?: string | null;
  description?: string | null;
  room_description?: string | null;
  requirements?: string | null;
  amenities?: unknown;
  gallery?: unknown;
  owner_id?: string | null;
  base_people?: number | null;
  extra_fee_rate?: number | string | null;
};

type RoomRow = {
  id: string;
  name: string;
  room_type?: string | null;
  beds?: number | null;
  bed_type?: string | null;
  base_people?: number | null;
  max_people?: number | null;
  capacity?: number | null;
  base_price?: number | string | null;
  price_multiplier?: number | string | null;
  vip?: boolean | null;
  description?: string | null;
  image?: string | null;
  available?: number | null;
  amenities?: unknown;
  owner_email?: string | null;
};

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    return value.split(/[|\n]/).map((x) => x.trim()).filter(Boolean);
  }
  return [];
}

function mapRoom(row: RoomRow, hotelPrice: number): HotelRoom {
  const rawTier = String(row.room_type ?? (row.vip ? "vip" : "standard")).toLowerCase();
  const tier = (["standard", "deluxe", "vip"].includes(rawTier) ? rawTier : "standard") as HotelRoom["tier"];
  const basePrice = Number(row.base_price ?? 0);
  const multiplier = hotelPrice > 0 && basePrice > 0 ? basePrice / hotelPrice : Number(row.price_multiplier ?? 1);
  return {
    id: row.id,
    name: row.name,
    tier,
    beds: Number(row.beds ?? 1),
    bedType: row.bed_type ?? `${row.beds ?? 1} giường`,
    basePeople: Number(row.base_people ?? 2),
    maxPeople: Number(row.capacity ?? row.max_people ?? 2),
    priceMultiplier: Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1,
    basePrice: basePrice > 0 ? basePrice : undefined,
    available: Number(row.available ?? 0),
    description: row.description ?? "",
    amenities: asStringArray(row.amenities),
    ownerEmail: row.owner_email ?? undefined,
  };
}

export function mapHotelWithRooms(row: HotelRow, rooms: RoomRow[] = [], idx = 0): Hotel {
  const price = Number(row.price ?? 0);
  return hydrateHotelDetails({
    id: row.id,
    name: row.name,
    address: row.address ?? row.city,
    city: row.city,
    price,
    rating: Number(row.rating ?? 4.5),
    stars: Number(row.stars ?? 3),
    image: row.image ?? "",
    amenities: asStringArray(row.amenities),
    checkIn: row.check_in ?? undefined,
    checkOut: row.check_out ?? undefined,
    description: row.description ?? "",
    roomDescription: row.room_description ?? undefined,
    requirements: row.requirements ? String(row.requirements).split("|").filter(Boolean) : [],
    gallery: asStringArray(row.gallery),
    ownerId: row.owner_id ?? undefined,
    basePeople: row.base_people ?? undefined,
    extraFeeRate: row.extra_fee_rate == null ? undefined : Number(row.extra_fee_rate),
    rooms: rooms.map((r) => mapRoom(r, price)),
  }, idx);
}

export async function fetchHotelWithRooms(hotelId: string): Promise<Hotel | null> {
  const { data: hotel, error: hotelError } = await supabase
    .from("hotels")
    .select("*")
    .eq("id", hotelId)
    .maybeSingle();
  if (hotelError) throw new Error(explainSupabaseError(hotelError, "Không tải được khách sạn từ Supabase"));
  if (!hotel) return null;

  const { data: rooms, error: roomError } = await supabase
    .from("hotel_rooms")
    .select("*")
    .eq("hotel_id", hotelId)
    .order("created_at", { ascending: true });
  if (roomError) throw new Error(explainSupabaseError(roomError, "Không tải được phòng khách sạn từ Supabase"));

  return mapHotelWithRooms(hotel as unknown as HotelRow, (rooms ?? []) as unknown as RoomRow[]);
}
