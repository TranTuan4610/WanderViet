// Tọa độ trung tâm các thành phố du lịch chính tại Việt Nam.
// Dùng để mở Google Maps với ghim (marker) gần đúng vị trí khách sạn khi
// dữ liệu chưa có lat/lng riêng.
export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "phú quốc": { lat: 10.2899, lng: 103.984 },
  "phu quoc": { lat: 10.2899, lng: 103.984 },
  "đà nẵng": { lat: 16.0544, lng: 108.2022 },
  "da nang": { lat: 16.0544, lng: 108.2022 },
  "đà lạt": { lat: 11.9404, lng: 108.4583 },
  "da lat": { lat: 11.9404, lng: 108.4583 },
  "nha trang": { lat: 12.2388, lng: 109.1967 },
  "hà nội": { lat: 21.0285, lng: 105.8542 },
  "ha noi": { lat: 21.0285, lng: 105.8542 },
  "hồ chí minh": { lat: 10.7769, lng: 106.7009 },
  "ho chi minh": { lat: 10.7769, lng: 106.7009 },
  "tp. hồ chí minh": { lat: 10.7769, lng: 106.7009 },
  "huế": { lat: 16.4637, lng: 107.5909 },
  "hue": { lat: 16.4637, lng: 107.5909 },
  "hội an": { lat: 15.8801, lng: 108.338 },
  "hoi an": { lat: 15.8801, lng: 108.338 },
  "vũng tàu": { lat: 10.346, lng: 107.0843 },
  "vung tau": { lat: 10.346, lng: 107.0843 },
  "hạ long": { lat: 20.9101, lng: 107.1839 },
  "ha long": { lat: 20.9101, lng: 107.1839 },
  "sapa": { lat: 22.3364, lng: 103.844 },
  "sa pa": { lat: 22.3364, lng: 103.844 },
  "quy nhơn": { lat: 13.7829, lng: 109.2196 },
  "quy nhon": { lat: 13.7829, lng: 109.2196 },
  "phan thiết": { lat: 10.9333, lng: 108.1 },
  "phan thiet": { lat: 10.9333, lng: 108.1 },
  "mũi né": { lat: 10.9333, lng: 108.2833 },
  "mui ne": { lat: 10.9333, lng: 108.2833 },
};

function hashOffset(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  // Lệch ±0.012° (~1.3km) để các khách sạn cùng thành phố không trùng pin.
  const lat = (((h >>> 0) % 1000) / 1000 - 0.5) * 0.024;
  const lng = ((((h >>> 8) >>> 0) % 1000) / 1000 - 0.5) * 0.024;
  return { lat, lng };
}

export function getHotelCoords(hotel: { id: string; city?: string; address?: string }) {
  const key = (hotel.city ?? "").trim().toLowerCase();
  const base = CITY_COORDS[key];
  if (!base) return null;
  const off = hashOffset(hotel.id);
  return { lat: +(base.lat + off.lat).toFixed(6), lng: +(base.lng + off.lng).toFixed(6) };
}

export function buildGoogleMapsUrl(hotel: {
  id: string;
  name: string;
  city?: string;
  address?: string;
}) {
  const coords = getHotelCoords(hotel);
  const label = [hotel.name, hotel.address, hotel.city].filter(Boolean).join(", ");
  if (coords) {
    // Mở Google Maps với ghim đúng toạ độ.
    return `https://www.google.com/maps?q=${coords.lat},${coords.lng}`;
  }
  return `https://www.google.com/maps?q=${encodeURIComponent(label)}`;
}

// URL nhúng OpenStreetMap với marker đúng toạ độ — hiển thị bản đồ ngay trong trang.
export function buildOsmEmbedUrl(hotel: { id: string; city?: string; address?: string }) {
  const coords = getHotelCoords(hotel);
  if (!coords) return null;
  const d = 0.02; // ~2km khung nhìn
  const bbox = [coords.lng - d, coords.lat - d, coords.lng + d, coords.lat + d].join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`;
}
