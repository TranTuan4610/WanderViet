// =============================================================
// Admin data store — Supabase as the single source of truth.
//
// `tours`, `hotels`, `flights` arrays in mockData.ts start empty
// and are populated by `initDataFromDb()` on app boot. Any admin
// create/update/delete writes to Supabase first, then refetches
// to keep the arrays in sync. Components re-render via
// `useAdminVersion()`.
// =============================================================
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminInsert, adminUpdate, adminDelete } from "./admin.functions";
import {
  flights,
  getHotelDescription,
  hotels,
  hydrateHotelDetails,
  tours,
  type Flight,
  type Hotel,
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

// ---------- DB row mappers ----------
type TourRow = {
  id: string;
  title: string;
  destination: string;
  image: string | null;
  price: number | string;
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
    days: row.days,
    nights: row.nights,
    rating: Number(row.rating ?? 4.5),
    reviews: 0,
    stars: row.stars ?? 4,
    type: (row.type ?? "Biển") as Tour["type"],
    seatsLeft: row.seats_left ?? 10,
    schedule: (row.schedule as Tour["schedule"]) ?? [],
    included: (row.included as string[]) ?? [],
    excluded: (row.excluded as string[]) ?? [],
    gallery: (row.gallery as string[]) ?? [],
    description: row.description ?? "",
    videoUrl: row.video_url ?? undefined,
  };
}

type HotelRow = {
  id: string;
  name: string;
  city: string;
  price: number | string;
  rating: number | string | null;
  stars: number;
  image: string | null;
  check_in: string | null;
  check_out: string | null;
  description: string | null;
  requirements: string | null;
  gallery: unknown;
  owner_id: string | null;
};
function mapHotel(row: HotelRow, idx: number): Hotel {
  return hydrateHotelDetails(
    {
      id: row.id,
      name: row.name,
      address: row.city,
      city: row.city,
      price: Number(row.price),
      rating: Number(row.rating ?? 4.5),
      stars: row.stars ?? 3,
      image: row.image ?? "",
      amenities: [],
      checkIn: row.check_in ?? undefined,
      checkOut: row.check_out ?? undefined,
      description: row.description ?? "",
      requirements: row.requirements ? String(row.requirements).split("|") : [],
      gallery: (row.gallery as string[]) ?? [],
      ownerId: row.owner_id ?? undefined,
    },
    idx,
  );
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
  if (error) {
    console.error("[adminStore] refreshTours", error);
    return;
  }
  replaceArray(tours, (data as TourRow[] | null)?.map(mapTour) ?? []);
  bump();
}
async function refreshHotels() {
  const { data, error } = await supabase.from("hotels").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("[adminStore] refreshHotels", error);
    return;
  }
  replaceArray(hotels, (data as HotelRow[] | null)?.map((row, i) => mapHotel(row, i)) ?? []);
  bump();
}
async function refreshFlights() {
  const { data, error } = await supabase.from("flights").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("[adminStore] refreshFlights", error);
    return;
  }
  replaceArray(flights, (data as FlightRow[] | null)?.map(mapFlight) ?? []);
  bump();
}

export async function refreshFromDb() {
  await Promise.all([refreshTours(), refreshHotels(), refreshFlights()]);
}

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
  try {
    await adminInsert({ data: { table: "tours", values: tourDbValues(t) } });
  } catch (e) {
    console.error("addTour DB error", e);
    throw e;
  }
  await refreshTours();
}

export async function updateTour(id: string, patch: Partial<Tour>) {
  const dbPatch: Record<string, unknown> = {};
  if (patch.title !== undefined) dbPatch.title = patch.title;
  if (patch.destination !== undefined) dbPatch.destination = patch.destination;
  if (patch.image !== undefined) dbPatch.image = patch.image;
  if (patch.price !== undefined) dbPatch.price = patch.price;
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
  try {
    await adminUpdate({ data: { table: "tours", id, values: dbPatch } });
  } catch (e) {
    console.error("updateTour DB error", e);
    throw e;
  }
  await refreshTours();
}

export async function deleteTour(id: string) {
  try {
    await adminDelete({ data: { table: "tours", id } });
  } catch (e) {
    console.error("deleteTour DB error", e);
    throw e;
  }
  await refreshTours();
}

// ---------- HOTELS CRUD ----------
export async function addHotel(h: Omit<Hotel, "id">) {
  const hotelToSave: Omit<Hotel, "id"> = {
    ...h,
    description: h.description?.trim() || getHotelDescription(h as Hotel),
    amenities: h.amenities?.length ? h.amenities : ["Wifi", "Nhà hàng", "Lễ tân 24h"],
    requirements: h.requirements?.length ? h.requirements : undefined,
  };
  try {
    await adminInsert({
      data: {
        table: "hotels",
        values: {
          name: hotelToSave.name,
          city: hotelToSave.city,
          price: hotelToSave.price,
          rating: hotelToSave.rating,
          stars: hotelToSave.stars,
          image: hotelToSave.image,
          description: hotelToSave.description,
          check_in: hotelToSave.checkIn,
          check_out: hotelToSave.checkOut,
          requirements: hotelToSave.requirements?.join("|"),
          gallery: hotelToSave.gallery ?? [],
          owner_id: hotelToSave.ownerId ?? null,
        },
      },
    });
  } catch (e) {
    console.error("addHotel DB error", e);
    throw e;
  }
  await refreshHotels();
}

export async function updateHotel(id: string, patch: Partial<Hotel>) {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.city !== undefined) dbPatch.city = patch.city;
  if (patch.price !== undefined) dbPatch.price = patch.price;
  if (patch.rating !== undefined) dbPatch.rating = patch.rating;
  if (patch.stars !== undefined) dbPatch.stars = patch.stars;
  if (patch.image !== undefined) dbPatch.image = patch.image;
  if (patch.description !== undefined) dbPatch.description = patch.description;
  if (patch.checkIn !== undefined) dbPatch.check_in = patch.checkIn;
  if (patch.checkOut !== undefined) dbPatch.check_out = patch.checkOut;
  if (patch.requirements !== undefined) dbPatch.requirements = patch.requirements?.join("|");
  if (patch.gallery !== undefined) dbPatch.gallery = patch.gallery;
  try {
    await adminUpdate({ data: { table: "hotels", id, values: dbPatch } });
  } catch (e) {
    console.error("updateHotel DB error", e);
    throw e;
  }
  await refreshHotels();
}

export async function deleteHotel(id: string) {
  try {
    await adminDelete({ data: { table: "hotels", id } });
  } catch (e) {
    console.error("deleteHotel DB error", e);
    throw e;
  }
  await refreshHotels();
}

// ---------- FLIGHTS CRUD ----------
export async function addFlight(f: Omit<Flight, "id">) {
  try {
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
  } catch (e) {
    console.error("addFlight DB error", e);
    throw e;
  }
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
  try {
    await adminUpdate({ data: { table: "flights", id, values: dbPatch } });
  } catch (e) {
    console.error("updateFlight DB error", e);
    throw e;
  }
  await refreshFlights();
}

export async function deleteFlight(id: string) {
  try {
    await adminDelete({ data: { table: "flights", id } });
  } catch (e) {
    console.error("deleteFlight DB error", e);
    throw e;
  }
  await refreshFlights();
}
