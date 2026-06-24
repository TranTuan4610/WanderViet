// Vehicle rentals — client-side store with localStorage persistence.
// Seeded with 10 motorbikes + 10 cars per location; editable via /admin/rentals.
import { useSyncExternalStore } from "react";

export type VehicleType = "motorbike" | "car";

export type Vehicle = {
  id: string;
  type: VehicleType;
  name: string;
  brand: string;
  seats?: number;
  transmission?: "manual" | "auto";
  pricePerDay: number; // VND
  image: string;
};

export type RentalLocation = {
  slug: string;
  name: string;
  vehicles: Vehicle[];
};

const motorbikeModels = [
  { brand: "Honda", name: "Vision 2023", price: 150_000, img: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600" },
  { brand: "Honda", name: "Air Blade 160", price: 200_000, img: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600" },
  { brand: "Honda", name: "SH 150i", price: 350_000, img: "https://images.unsplash.com/photo-1611241443322-b5c8082896b4?w=600" },
  { brand: "Yamaha", name: "Janus", price: 140_000, img: "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=600" },
  { brand: "Yamaha", name: "Exciter 155", price: 220_000, img: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=600" },
  { brand: "Yamaha", name: "NVX 155", price: 240_000, img: "https://images.unsplash.com/photo-1635073908681-b4dfd24fd2bd?w=600" },
  { brand: "Piaggio", name: "Liberty 125", price: 280_000, img: "https://images.unsplash.com/photo-1517511620798-cec17d428bc0?w=600" },
  { brand: "Piaggio", name: "Vespa Sprint", price: 380_000, img: "https://images.unsplash.com/photo-1591637333472-99086a5f3f8d?w=600" },
  { brand: "Suzuki", name: "Raider R150", price: 200_000, img: "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600" },
  { brand: "SYM", name: "Attila V", price: 160_000, img: "https://images.unsplash.com/photo-1580310614729-ccd69652491d?w=600" },
];

const carModels = [
  { brand: "Toyota", name: "Vios", seats: 5, transmission: "manual" as const, price: 700_000, img: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600" },
  { brand: "Toyota", name: "Innova", seats: 7, transmission: "auto" as const, price: 1_100_000, img: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600" },
  { brand: "Toyota", name: "Fortuner", seats: 7, transmission: "auto" as const, price: 1_500_000, img: "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=600" },
  { brand: "Hyundai", name: "Accent", seats: 5, transmission: "auto" as const, price: 750_000, img: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=600" },
  { brand: "Hyundai", name: "SantaFe", seats: 7, transmission: "auto" as const, price: 1_600_000, img: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600" },
  { brand: "Kia", name: "Morning", seats: 5, transmission: "manual" as const, price: 600_000, img: "https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600" },
  { brand: "Kia", name: "Seltos", seats: 5, transmission: "auto" as const, price: 950_000, img: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600" },
  { brand: "Mazda", name: "Mazda 3", seats: 5, transmission: "auto" as const, price: 900_000, img: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600" },
  { brand: "Ford", name: "Ranger", seats: 5, transmission: "auto" as const, price: 1_400_000, img: "https://images.unsplash.com/photo-1605893477799-b99e3b8b93fe?w=600" },
  { brand: "VinFast", name: "VF8", seats: 5, transmission: "auto" as const, price: 1_800_000, img: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=600" },
];

const locationDefs = [
  { slug: "ha-noi", name: "Hà Nội", priceMul: 1.0 },
  { slug: "ho-chi-minh", name: "TP. Hồ Chí Minh", priceMul: 1.1 },
  { slug: "da-nang", name: "Đà Nẵng", priceMul: 0.95 },
  { slug: "hoi-an", name: "Hội An", priceMul: 0.9 },
  { slug: "nha-trang", name: "Nha Trang", priceMul: 0.95 },
  { slug: "da-lat", name: "Đà Lạt", priceMul: 0.9 },
  { slug: "phu-quoc", name: "Phú Quốc", priceMul: 1.05 },
  { slug: "hue", name: "Huế", priceMul: 0.9 },
];

function seed(): RentalLocation[] {
  return locationDefs.map((loc) => ({
    slug: loc.slug,
    name: loc.name,
    vehicles: [
      ...motorbikeModels.map((m, i) => ({
        id: `${loc.slug}-mb-${i + 1}`,
        type: "motorbike" as const,
        name: m.name,
        brand: m.brand,
        pricePerDay: Math.round((m.price * loc.priceMul) / 1000) * 1000,
        image: m.img,
      })),
      ...carModels.map((c, i) => ({
        id: `${loc.slug}-car-${i + 1}`,
        type: "car" as const,
        name: c.name,
        brand: c.brand,
        seats: c.seats,
        transmission: c.transmission,
        pricePerDay: Math.round((c.price * loc.priceMul) / 1000) * 1000,
        image: c.img,
      })),
    ],
  }));
}

const STORAGE_KEY = "wv_rentals_v1";

function loadInitial(): RentalLocation[] {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RentalLocation[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch { /* ignore */ }
  return seed();
}

export const rentalLocations: RentalLocation[] = loadInitial();

// ---------- subscription ----------
const listeners = new Set<() => void>();
let version = 0;
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const getSnapshot = () => version;
export function useRentalsVersion() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
function persist() {
  if (typeof window !== "undefined") {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rentalLocations)); } catch { /* ignore */ }
  }
  version++;
  listeners.forEach((l) => l());
}

export function getLocation(slug: string) {
  return rentalLocations.find((l) => l.slug === slug);
}

function findLoc(slug: string) {
  const loc = rentalLocations.find((l) => l.slug === slug);
  if (!loc) throw new Error(`Unknown location: ${slug}`);
  return loc;
}

export function addVehicle(locationSlug: string, v: Omit<Vehicle, "id">) {
  const loc = findLoc(locationSlug);
  const id = `${locationSlug}-${v.type === "motorbike" ? "mb" : "car"}-${Date.now()}`;
  loc.vehicles.push({ ...v, id });
  persist();
}

export function updateVehicle(locationSlug: string, id: string, patch: Partial<Omit<Vehicle, "id">>) {
  const loc = findLoc(locationSlug);
  const idx = loc.vehicles.findIndex((v) => v.id === id);
  if (idx === -1) return;
  loc.vehicles[idx] = { ...loc.vehicles[idx], ...patch };
  persist();
}

export function deleteVehicle(locationSlug: string, id: string) {
  const loc = findLoc(locationSlug);
  const idx = loc.vehicles.findIndex((v) => v.id === id);
  if (idx === -1) return;
  loc.vehicles.splice(idx, 1);
  persist();
}

export function resetRentals() {
  rentalLocations.length = 0;
  rentalLocations.push(...seed());
  persist();
}
