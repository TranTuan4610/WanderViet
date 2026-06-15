import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminInsert, adminUpdate, adminDelete } from "./admin.functions";
import {
  flights,
  getHotelDescription,
  hydrateHotelDetails,
  hotels,
  tours,
  type Flight,
  type Hotel,
  type Tour,
} from "./mockData";

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

// Detect uuid (DB row) vs mock id (e.g. "t1", "h1", "f1")
const isUuid = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
const seededTourDbIds: Record<string, string> = {
  t1: "22222222-2222-2222-2222-222222222201",
  t2: "22222222-2222-2222-2222-222222222202",
  t3: "22222222-2222-2222-2222-222222222203",
  t4: "22222222-2222-2222-2222-222222222204",
  t5: "22222222-2222-2222-2222-222222222205",
};
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

// ---------- TOURS ----------
export async function addTour(t: Omit<Tour, "id">) {
  let id = `t${Date.now()}`;
  try {
    const res = await adminInsert({ data: { table: "tours", values: tourDbValues(t) } });
    id = res.id;
  } catch (e) {
    console.error("addTour DB error", e);
  }
  tours.unshift({ ...t, id } as Tour);
  bump();
}
export async function updateTour(id: string, patch: Partial<Tour>) {
  const i = tours.findIndex((x) => x.id === id);
  const persistedId = isUuid(id) ? id : seededTourDbIds[id];
  let merged: Tour | null = null;
  if (i >= 0) {
    tours[i] = { ...tours[i], ...patch };
    merged = tours[i];
  }
  // Also sync the DB-loaded twin (UUID id) so /tours/:uuid sees the same data.
  if (persistedId && persistedId !== id) {
    const j = tours.findIndex((x) => x.id === persistedId);
    if (j >= 0) tours[j] = { ...tours[j], ...patch };
  }
  bump();
  if (persistedId) {
    const dbPatch: Record<string, unknown> = {};
    if (!isUuid(id) && merged) Object.assign(dbPatch, tourDbValues(merged));
    else {
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
    }
    try {
      await adminUpdate({ data: { table: "tours", id: persistedId, values: dbPatch } });
    } catch (e) {
      console.error("updateTour DB error", e);
    }
  } else if (merged) {
    try {
      const res = await adminInsert({ data: { table: "tours", values: tourDbValues(merged) } });
      const idx = tours.findIndex((x) => x.id === id);
      if (idx >= 0) {
        tours[idx] = { ...tours[idx], id: res.id };
        bump();
      }
    } catch (e) {
      console.error("updateTour DB insert error", e);
    }
  }
}
export async function deleteTour(id: string) {
  const i = tours.findIndex((x) => x.id === id);
  if (i >= 0) {
    tours.splice(i, 1);
    bump();
  }
  if (isUuid(id)) {
    try {
      await adminDelete({ data: { table: "tours", id } });
    } catch (e) {
      console.error("deleteTour DB error", e);
    }
  }
}

// ---------- HOTELS ----------
export async function addHotel(h: Omit<Hotel, "id">) {
  let id = `h${Date.now()}`;
  const hotelToSave: Omit<Hotel, "id"> = {
    ...h,
    description: h.description?.trim() || getHotelDescription(h as Hotel),
    amenities: h.amenities?.length ? h.amenities : ["Wifi", "Nhà hàng", "Lễ tân 24h"],
    requirements: h.requirements?.length ? h.requirements : undefined,
  };
  try {
    const res = await adminInsert({
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
    id = res.id;
  } catch (e) {
    console.error("addHotel DB error", e);
  }
  hotels.unshift(hydrateHotelDetails({ ...hotelToSave, id } as Hotel));
  bump();
}
export async function updateHotel(id: string, patch: Partial<Hotel>) {
  const i = hotels.findIndex((x) => x.id === id);
  if (i >= 0) {
    hotels[i] = { ...hotels[i], ...patch };
    bump();
  }
  if (isUuid(id)) {
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
    }
  }
}
export async function deleteHotel(id: string) {
  const i = hotels.findIndex((x) => x.id === id);
  if (i >= 0) {
    hotels.splice(i, 1);
    bump();
  }
  if (isUuid(id)) {
    try {
      await adminDelete({ data: { table: "hotels", id } });
    } catch (e) {
      console.error("deleteHotel DB error", e);
    }
  }
}

// ---------- FLIGHTS ----------
export async function addFlight(f: Omit<Flight, "id">) {
  let id = `f${Date.now()}`;
  try {
    const res = await adminInsert({
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
    id = res.id;
  } catch (e) {
    console.error("addFlight DB error", e);
  }
  flights.unshift({ ...f, id } as Flight);
  bump();
}
export async function updateFlight(id: string, patch: Partial<Flight>) {
  const i = flights.findIndex((x) => x.id === id);
  if (i >= 0) {
    flights[i] = { ...flights[i], ...patch };
    bump();
  }
  if (isUuid(id)) {
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
    }
  }
}
export async function deleteFlight(id: string) {
  const i = flights.findIndex((x) => x.id === id);
  if (i >= 0) {
    flights.splice(i, 1);
    bump();
  }
  if (isUuid(id)) {
    try {
      await adminDelete({ data: { table: "flights", id } });
    } catch (e) {
      console.error("deleteFlight DB error", e);
    }
  }
}

// ---------- INIT: load DB rows and merge into in-memory mock arrays ----------
let initialized = false;
export async function initDataFromDb() {
  if (initialized) return;
  initialized = true;
  try {
    const [t, h, f] = await Promise.all([
      supabase.from("tours").select("*"),
      supabase.from("hotels").select("*"),
      supabase.from("flights").select("*"),
    ]);
    if (t.data) {
      // Build reverse map: DB UUID -> mock id (e.g. "22222...2201" -> "t1")
      const dbToMockId: Record<string, string> = {};
      for (const [mock, db] of Object.entries(seededTourDbIds)) dbToMockId[db] = mock;
      for (const row of t.data) {
        const mapped: Tour = {
          id: row.id,
          title: row.title,
          destination: row.destination,
          image: row.image ?? "",
          price: Number(row.price),
          days: row.days,
          nights: row.nights,
          rating: Number(row.rating ?? 4.5),
          reviews: 0,
          stars: (row as { stars?: number }).stars ?? 4,
          type: ((row as { type?: string }).type ?? "Biển") as Tour["type"],
          seatsLeft: row.seats_left ?? 10,
          schedule: ((row as { schedule?: unknown }).schedule as Tour["schedule"]) ?? [],
          included: ((row as { included?: unknown }).included as string[]) ?? [],
          excluded: ((row as { excluded?: unknown }).excluded as string[]) ?? [],
          description: row.description ?? "",
          gallery: ((row as { gallery?: unknown }).gallery as string[]) ?? [],
          videoUrl: ((row as { video_url?: string | null }).video_url) ?? undefined,
        };
        // If this DB row corresponds to a seeded mock tour, overwrite the mock
        // entry IN-PLACE with the latest DB data (keeps the mock id so admin
        // edits keep working, while exposing schedule/included/excluded).
        const mockId = dbToMockId[row.id];
        if (mockId) {
          const idx = tours.findIndex((x) => x.id === mockId);
          if (idx >= 0) {
            tours[idx] = { ...tours[idx], ...mapped, id: mockId };
          }
        }
        // Also keep a copy under the UUID id so /tours/:uuid resolves.
        if (!tours.find((x) => x.id === row.id)) tours.unshift(mapped);
      }
    }
    if (h.data) {
      for (const row of h.data) {
        if (hotels.find((x) => x.id === row.id)) continue;
        hotels.unshift(
          hydrateHotelDetails(
            {
              id: row.id,
              name: row.name,
              address: "",
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
              gallery: ((row as { gallery?: unknown }).gallery as string[]) ?? [],
              ownerId: ((row as { owner_id?: string | null }).owner_id) ?? undefined,
            },
            hotels.length,
          ),
        );
      }
    }
    if (f.data) {
      for (const row of f.data) {
        if (flights.find((x) => x.id === row.id)) continue;
        flights.unshift({
          id: row.id,
          airline: row.airline,
          from: row.from_code,
          to: row.to_code,
          depart: row.depart,
          arrive: row.arrive,
          duration: row.duration ?? "",
          price: Number(row.price),
          baggage: row.baggage ?? "",
        });
      }
    }
    bump();
  } catch (e) {
    console.error("initDataFromDb error", e);
  }
}
