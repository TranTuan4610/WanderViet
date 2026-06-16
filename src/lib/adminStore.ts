// =============================================================
// Admin data store — Supabase is the single source of truth.
//
// Every admin create/update/delete runs through server functions
// with the Supabase service role. After each mutation, the related
// list is refetched and subscribers re-render immediately.
// =============================================================
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminInsert, adminUpdate, adminDelete } from "./admin.functions";
import { explainSupabaseError } from "./adminErrors";
import {
  flights,
  getHotelDescription,
  hotels,
  hydrateHotelDetails,
  tours,
  type Flight,
  type Hotel,
  type HotelRoom,
  type Tour,
} from "./mockData";

// ---------- subscription ----------
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
let version = 0;
const getSnapshot = () => version;
export function useAdminVersion() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
const bump = () => {
  version++;
  notify();
};

const asStringArray = (value: unknown): string[] => Array.isArray(value) ? value.map(String).filter(Boolean) : [];
const asSchedule = (value: unknown): Tour["schedule"] => Array.isArray(value) ? (value as Tour["schedule"]) : [];

// ---------- DB row mappers ----------
type TourRow = {
  id: string;
  title: string;
  destination: string;
  image: string | null;
  price: number | string;
  old_price?: number | string | null;
  days: number;
  nights: number;
  rating: number | string | null;
  seats_left: number | null;
  description: string | null;
  type: string | null;
  stars: number | null;
  schedule: unknown;
  included: unknown;
  excluded: unknown;
  gallery: unknown;
  video_url: string | null;
};
function mapTour(row: TourRow): Tour {
  return {
    id: row.id,
    title: row.title,
    destination: row.destination,
    image: row.image ?? "",
    price: Number(row.price),
    oldPrice: row.old_price == null ? undefined : Number(row.old_price),
    days: row.days,
    nights: row.nights,
    rating: Number(row.rating ?? 4.5),
    reviews: 0,
    stars: row.stars ?? 4,
    type: (row.type ?? "Biển") as Tour["type"],
    seatsLeft: row.seats_left ?? 10,
    schedule: asSchedule(row.schedule),
    included: asStringArray(row.included),
    excluded: asStringArray(row.excluded),
    gallery: asStringArray(row.gallery),
    description: row.description ?? "",
    videoUrl: row.video_url ?? undefined,
  };
}

type HotelRoomRow = {
  id: string;
  hotel_id: string;
  name: string;
  room_type?: string | null;
  beds: number;
  bed_type?: string | null;
  base_people: number;
  max_people: number;
  capacity?: number | null;
  base_price: number | string;
  price_multiplier?: number | string | null;
  vip: boolean;
  description: string | null;
  image: string | null;
  available: number | null;
  amenities?: unknown;
  owner_email?: string | null;
};

function mapRoom(row: HotelRoomRow, hotelPrice: number): HotelRoom {
  const rawTier = (row.room_type ?? (row.vip ? "vip" : "standard")).toLowerCase();
  const tier = (["standard", "deluxe", "vip"].includes(rawTier) ? rawTier : row.vip ? "vip" : "standard") as HotelRoom["tier"];
  const basePrice = Number(row.base_price ?? 0);
  const computedMultiplier = hotelPrice > 0 && basePrice > 0 ? basePrice / hotelPrice : 1;
  return {
    id: row.id,
    name: row.name,
    tier,
    beds: Number(row.beds ?? 1),
    bedType: row.bed_type ?? `${row.beds ?? 1} giường`,
    basePeople: Number(row.base_people ?? 2),
    maxPeople: Number(row.capacity ?? row.max_people ?? 4),
    priceMultiplier: Number(row.price_multiplier ?? computedMultiplier || 1),
    basePrice: basePrice || undefined,
    available: Number(row.available ?? 0),
    description: row.description ?? "",
    amenities: asStringArray(row.amenities),
    ownerEmail: row.owner_email ?? undefined,
  };
}

type HotelRow = {
  id: string;
  name: string;
  address?: string | null;
  city: string;
  price: number | string;
  rating: number | string | null;
  stars: number;
  image: string | null;
  check_in: string | null;
  check_out: string | null;
  description: string | null;
  room_description?: string | null;
  requirements: string | null;
  amenities?: unknown;
  gallery: unknown;
  owner_id: string | null;
  base_people?: number | null;
  extra_fee_rate?: number | string | null;
};
function mapHotel(row: HotelRow, idx: number, roomRows: HotelRoomRow[] = []): Hotel {
  const price = Number(row.price);
  const mappedRooms = roomRows.map((r) => mapRoom(r, price));
  const hotel = hydrateHotelDetails(
    {
      id: row.id,
      name: row.name,
      address: row.address ?? row.city,
      city: row.city,
      price,
      rating: Number(row.rating ?? 4.5),
      stars: row.stars ?? 3,
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
      rooms: mappedRooms.length ? mappedRooms : undefined,
    },
    idx,
  );
  return hotel;
}

type FlightRow = {
  id: string;
  airline: string;
  from_code: string;
  to_code: string;
  depart: string;
  arrive: string;
  duration: string | null;
  price: number | string;
  baggage: string | null;
};
function mapFlight(row: FlightRow): Flight {
  return {
    id: row.id,
    airline: row.airline,
    from: row.from_code,
    to: row.to_code,
    depart: row.depart,
    arrive: row.arrive,
    duration: row.duration ?? "",
    price: Number(row.price),
    baggage: row.baggage ?? "",
  };
}

// ---------- core refresh ----------
const replaceArray = <T>(arr: T[], next: T[]) => {
  arr.length = 0;
  arr.push(...next);
};

async function refreshTours() {
  const { data, error } = await supabase.from("tours").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(explainSupabaseError(error, "Không tải được tours từ Supabase"));
  replaceArray(tours, (data as TourRow[] | null)?.map(mapTour) ?? []);
  bump();
}
async function refreshHotels() {
  const { data, error } = await supabase.from("hotels").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(explainSupabaseError(error, "Không tải được khách sạn từ Supabase"));
  const rows = (data ?? []) as unknown as HotelRow[];
  const ids = rows.map((r) => r.id);
  let roomRows: HotelRoomRow[] = [];
  if (ids.length) {
    const { data: roomData, error: roomError } = await supabase
      .from("hotel_rooms")
      .select("*")
      .in("hotel_id", ids)
      .order("created_at", { ascending: true });
    if (roomError) throw new Error(explainSupabaseError(roomError, "Không tải được phòng khách sạn từ Supabase"));
    roomRows = (roomData ?? []) as unknown as HotelRoomRow[];
  }
  replaceArray(
    hotels,
    rows.map((row, i) => mapHotel(row, i, roomRows.filter((r) => r.hotel_id === row.id))),
  );
  bump();
}
async function refreshFlights() {
  const { data, error } = await supabase.from("flights").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(explainSupabaseError(error, "Không tải được chuyến bay từ Supabase"));
  replaceArray(flights, (data as FlightRow[] | null)?.map(mapFlight) ?? []);
  bump();
}

export async function refreshFromDb() {
  await Promise.all([refreshTours(), refreshHotels(), refreshFlights()]);
}
export async function refreshToursFromDb() { await refreshTours(); }
export async function refreshHotelsFromDb() { await refreshHotels(); }
export async function refreshFlightsFromDb() { await refreshFlights(); }

let initialized = false;
let initPromise: Promise<void> | null = null;
export function initDataFromDb() {
  if (initialized) return initPromise ?? Promise.resolve();
  initialized = true;
  initPromise = refreshFromDb().catch((e) => {
    console.error("[adminStore] init error", e);
  });
  return initPromise;
}

// ---------- TOURS CRUD ----------
const tourDbValues = (t: Omit<Tour, "id"> | Tour) => ({
  title: t.title,
  destination: t.destination,
  image: t.image,
  price: t.price,
  old_price: t.oldPrice ?? null,
  days: t.days,
  nights: t.nights,
  rating: t.rating,
  seats_left: t.seatsLeft,
  description: t.description,
  type: t.type,
  stars: t.stars,
  schedule: t.schedule ?? [],
  included: t.included ?? [],
  excluded: t.excluded ?? [],
  gallery: t.gallery ?? [],
  video_url: t.videoUrl ?? null,
});

export async function addTour(t: Omit<Tour, "id">) {
  await adminInsert({ data: { table: "tours", values: tourDbValues(t) } });
  await refreshTours();
}

export async function updateTour(id: string, patch: Partial<Tour>) {
  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.destination !== undefined) dbPatch.destination = patch.destination;
  if (patch.image !== undefined) dbPatch.image = patch.image;
  if (patch.price !== undefined) dbPatch.price = patch.price;
  if (patch.oldPrice !== undefined) dbPatch.old_price = patch.oldPrice ?? null;
  if (patch.days !== undefined) dbPatch.days = patch.days;
  if (patch.nights !== undefined) dbPatch.nights = patch.nights;
  if (patch.rating !== undefined) dbPatch.rating = patch.rating;
  if (patch.seatsLeft !== undefined) dbPatch.seats_left = patch.seatsLeft;
  if (patch.description !== undefined) dbPatch.description = patch.description;
  if (patch.type !== undefined) dbPatch.type = patch.type;
  if (patch.stars !== undefined) dbPatch.stars = patch.stars;
  if (patch.schedule !== undefined) dbPatch.schedule = patch.schedule;
  if (patch.included !== undefined) dbPatch.included = patch.included;
  if (patch.excluded !== undefined) dbPatch.excluded = patch.excluded;
  if (patch.gallery !== undefined) dbPatch.gallery = patch.gallery;
  if (patch.videoUrl !== undefined) dbPatch.video_url = patch.videoUrl ?? null;
  if (Object.keys(dbPatch).length === 0) return;
  await adminUpdate({ data: { table: "tours", id, values: dbPatch } });
  await refreshTours();
}

export async function deleteTour(id: string) {
  await adminDelete({ data: { table: "tours", id } });
  await refreshTours();
}

// ---------- HOTELS CRUD ----------
const hotelDbValues = (h: Omit<Hotel, "id"> | Hotel) => {
  const hotelToSave = {
    ...h,
    description: h.description?.trim() || getHotelDescription(h as Hotel),
    amenities: h.amenities?.length ? h.amenities : ["Wifi", "Nhà hàng", "Lễ tân 24h"],
    requirements: h.requirements?.length ? h.requirements : undefined,
  };
  return {
    name: hotelToSave.name,
    city: hotelToSave.city,
    address: hotelToSave.address || hotelToSave.city,
    price: hotelToSave.price,
    rating: hotelToSave.rating,
    stars: hotelToSave.stars,
    image: hotelToSave.image,
    description: hotelToSave.description,
    room_description: hotelToSave.roomDescription ?? null,
    check_in: hotelToSave.checkIn,
    check_out: hotelToSave.checkOut,
    requirements: hotelToSave.requirements?.join("|") ?? null,
    amenities: hotelToSave.amenities ?? [],
    gallery: hotelToSave.gallery ?? [],
    owner_id: hotelToSave.ownerId ?? null,
    base_people: hotelToSave.basePeople ?? 2,
    extra_fee_rate: hotelToSave.extraFeeRate ?? 0.25,
  };
};

export async function addHotel(h: Omit<Hotel, "id">) {
  await adminInsert({ data: { table: "hotels", values: hotelDbValues(h) } });
  await refreshHotels();
}

export async function updateHotel(id: string, patch: Partial<Hotel>) {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.city !== undefined) dbPatch.city = patch.city;
  if (patch.address !== undefined) dbPatch.address = patch.address;
  if (patch.price !== undefined) dbPatch.price = patch.price;
  if (patch.rating !== undefined) dbPatch.rating = patch.rating;
  if (patch.stars !== undefined) dbPatch.stars = patch.stars;
  if (patch.image !== undefined) dbPatch.image = patch.image;
  if (patch.description !== undefined) dbPatch.description = patch.description;
  if (patch.roomDescription !== undefined) dbPatch.room_description = patch.roomDescription;
  if (patch.checkIn !== undefined) dbPatch.check_in = patch.checkIn;
  if (patch.checkOut !== undefined) dbPatch.check_out = patch.checkOut;
  if (patch.requirements !== undefined) dbPatch.requirements = patch.requirements?.join("|") ?? null;
  if (patch.amenities !== undefined) dbPatch.amenities = patch.amenities;
  if (patch.gallery !== undefined) dbPatch.gallery = patch.gallery;
  if (patch.ownerId !== undefined) dbPatch.owner_id = patch.ownerId ?? null;
  if (patch.basePeople !== undefined) dbPatch.base_people = patch.basePeople;
  if (patch.extraFeeRate !== undefined) dbPatch.extra_fee_rate = patch.extraFeeRate;
  if (Object.keys(dbPatch).length === 0) return;
  await adminUpdate({ data: { table: "hotels", id, values: dbPatch } });
  await refreshHotels();
}

export async function deleteHotel(id: string) {
  await adminDelete({ data: { table: "hotels", id } });
  await refreshHotels();
}

// ---------- FLIGHTS CRUD ----------
export async function addFlight(f: Omit<Flight, "id">) {
  await adminInsert({
    data: {
      table: "flights",
      values: {
        airline: f.airline,
        from_code: f.from,
        to_code: f.to,
        depart: f.depart,
        arrive: f.arrive,
        duration: f.duration,
        price: f.price,
        baggage: f.baggage,
      },
    },
  });
  await refreshFlights();
}

export async function updateFlight(id: string, patch: Partial<Flight>) {
  const dbPatch: Record<string, unknown> = {};
  if (patch.airline !== undefined) dbPatch.airline = patch.airline;
  if (patch.from !== undefined) dbPatch.from_code = patch.from;
  if (patch.to !== undefined) dbPatch.to_code = patch.to;
  if (patch.depart !== undefined) dbPatch.depart = patch.depart;
  if (patch.arrive !== undefined) dbPatch.arrive = patch.arrive;
  if (patch.duration !== undefined) dbPatch.duration = patch.duration;
  if (patch.price !== undefined) dbPatch.price = patch.price;
  if (patch.baggage !== undefined) dbPatch.baggage = patch.baggage;
  if (Object.keys(dbPatch).length === 0) return;
  await adminUpdate({ data: { table: "flights", id, values: dbPatch } });
  await refreshFlights();
}

export async function deleteFlight(id: string) {
  await adminDelete({ data: { table: "flights", id } });
  await refreshFlights();
}
