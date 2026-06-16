// =============================================================
// Static reference data ONLY.
//
// Tours / Hotels / Flights are NO LONGER hardcoded here. They are
// loaded from Supabase by `initDataFromDb()` in src/lib/adminStore.ts
// and pushed into the exported `tours`, `hotels`, `flights` arrays.
// Components subscribe via `useAdminVersion()`.
//
// What stays here:
//   - Type definitions
//   - Geographic reference (destinations, airports) — not "production data"
//   - Promo placeholders, formatVND, hotel helpers
// =============================================================
import dalat from "@/assets/dest-dalat.jpg";
import phuquoc from "@/assets/dest-phuquoc.jpg";
import danang from "@/assets/dest-danang.jpg";
import nhatrang from "@/assets/dest-nhatrang.jpg";
import hanoi from "@/assets/dest-hanoi.jpg";
import hcm from "@/assets/dest-hcm.jpg";

export type Destination = {
  slug: string;
  name: string;
  description: string;
  fromPrice: number;
  image: string;
};

const baseDestinations: Destination[] = [
  { slug: "da-lat", name: "Đà Lạt", description: "Thành phố ngàn hoa, sương mờ huyền ảo", fromPrice: 1_990_000, image: dalat },
  { slug: "phu-quoc", name: "Phú Quốc", description: "Đảo ngọc biển xanh cát trắng", fromPrice: 3_490_000, image: phuquoc },
  { slug: "da-nang", name: "Đà Nẵng", description: "Thành phố đáng sống bên sông Hàn", fromPrice: 2_690_000, image: danang },
  { slug: "nha-trang", name: "Nha Trang", description: "Vịnh biển đẹp nhất Việt Nam", fromPrice: 2_390_000, image: nhatrang },
  { slug: "ha-noi", name: "Hà Nội", description: "Thủ đô ngàn năm văn hiến", fromPrice: 1_790_000, image: hanoi },
  { slug: "tp-hcm", name: "TP.HCM", description: "Hòn ngọc Viễn Đông sôi động", fromPrice: 1_690_000, image: hcm },
];

const provinceList: { slug: string; name: string; region: "Bắc" | "Trung" | "Nam"; desc: string }[] = [
  { slug: "an-giang", name: "An Giang", region: "Nam", desc: "Rừng tràm Trà Sư và núi Cấm linh thiêng" },
  { slug: "ba-ria-vung-tau", name: "Bà Rịa - Vũng Tàu", region: "Nam", desc: "Biển xanh gần Sài Gòn" },
  { slug: "bac-giang", name: "Bắc Giang", region: "Bắc", desc: "Vùng vải thiều thơm ngọt" },
  { slug: "bac-kan", name: "Bắc Kạn", region: "Bắc", desc: "Hồ Ba Bể hoang sơ" },
  { slug: "bac-lieu", name: "Bạc Liêu", region: "Nam", desc: "Quê hương đờn ca tài tử" },
  { slug: "bac-ninh", name: "Bắc Ninh", region: "Bắc", desc: "Cái nôi quan họ" },
  { slug: "ben-tre", name: "Bến Tre", region: "Nam", desc: "Xứ dừa miền Tây" },
  { slug: "binh-dinh", name: "Bình Định", region: "Trung", desc: "Đất võ trời văn Quy Nhơn" },
  { slug: "binh-duong", name: "Bình Dương", region: "Nam", desc: "Đô thị công nghiệp năng động" },
  { slug: "binh-phuoc", name: "Bình Phước", region: "Nam", desc: "Vùng đất đỏ bazan" },
  { slug: "binh-thuan", name: "Bình Thuận", region: "Trung", desc: "Đồi cát Mũi Né huyền ảo" },
  { slug: "ca-mau", name: "Cà Mau", region: "Nam", desc: "Mũi đất cực Nam Tổ quốc" },
  { slug: "cao-bang", name: "Cao Bằng", region: "Bắc", desc: "Thác Bản Giốc hùng vĩ" },
  { slug: "dak-lak", name: "Đắk Lắk", region: "Trung", desc: "Thủ phủ cà phê Buôn Ma Thuột" },
  { slug: "dak-nong", name: "Đắk Nông", region: "Trung", desc: "Cao nguyên M'Nông trữ tình" },
  { slug: "dien-bien", name: "Điện Biên", region: "Bắc", desc: "Chiến trường lịch sử oai hùng" },
  { slug: "dong-nai", name: "Đồng Nai", region: "Nam", desc: "Vườn quốc gia Cát Tiên" },
  { slug: "dong-thap", name: "Đồng Tháp", region: "Nam", desc: "Sen hồng và Tràm Chim" },
  { slug: "gia-lai", name: "Gia Lai", region: "Trung", desc: "Biển Hồ Pleiku thơ mộng" },
  { slug: "ha-giang", name: "Hà Giang", region: "Bắc", desc: "Cao nguyên đá Đồng Văn" },
  { slug: "ha-nam", name: "Hà Nam", region: "Bắc", desc: "Tam Chúc - ngôi chùa lớn nhất" },
  { slug: "ha-tinh", name: "Hà Tĩnh", region: "Trung", desc: "Biển Thiên Cầm hoang sơ" },
  { slug: "hai-duong", name: "Hải Dương", region: "Bắc", desc: "Quê hương Côn Sơn - Kiếp Bạc" },
  { slug: "hai-phong", name: "Hải Phòng", region: "Bắc", desc: "Thành phố hoa phượng đỏ" },
  { slug: "hau-giang", name: "Hậu Giang", region: "Nam", desc: "Chợ nổi Ngã Bảy" },
  { slug: "hoa-binh", name: "Hòa Bình", region: "Bắc", desc: "Thung lũng Mai Châu yên bình" },
  { slug: "hung-yen", name: "Hưng Yên", region: "Bắc", desc: "Phố Hiến cổ kính" },
  { slug: "khanh-hoa", name: "Khánh Hòa", region: "Trung", desc: "Vịnh Nha Trang xinh đẹp" },
  { slug: "kien-giang", name: "Kiên Giang", region: "Nam", desc: "Đảo ngọc Phú Quốc" },
  { slug: "kon-tum", name: "Kon Tum", region: "Trung", desc: "Nhà thờ gỗ Tây Nguyên" },
  { slug: "lai-chau", name: "Lai Châu", region: "Bắc", desc: "Đỉnh Pu Ta Leng hùng vĩ" },
  { slug: "lam-dong", name: "Lâm Đồng", region: "Trung", desc: "Đà Lạt - thành phố ngàn hoa" },
  { slug: "lang-son", name: "Lạng Sơn", region: "Bắc", desc: "Cửa khẩu Tân Thanh nhộn nhịp" },
  { slug: "lao-cai", name: "Lào Cai", region: "Bắc", desc: "Sapa mờ sương" },
  { slug: "long-an", name: "Long An", region: "Nam", desc: "Cửa ngõ miền Tây" },
  { slug: "nam-dinh", name: "Nam Định", region: "Bắc", desc: "Nhà thờ Phú Nhai cổ kính" },
  { slug: "nghe-an", name: "Nghệ An", region: "Trung", desc: "Quê Bác - biển Cửa Lò" },
  { slug: "ninh-binh", name: "Ninh Bình", region: "Bắc", desc: "Tràng An - Tam Cốc cổ tích" },
  { slug: "ninh-thuan", name: "Ninh Thuận", region: "Trung", desc: "Vịnh Vĩnh Hy và đồng cừu" },
  { slug: "phu-tho", name: "Phú Thọ", region: "Bắc", desc: "Đất Tổ Vua Hùng" },
  { slug: "phu-yen", name: "Phú Yên", region: "Trung", desc: "Hoa vàng cỏ xanh bên biển" },
  { slug: "quang-binh", name: "Quảng Bình", region: "Trung", desc: "Hang Sơn Đoòng kỳ vĩ" },
  { slug: "quang-nam", name: "Quảng Nam", region: "Trung", desc: "Hội An phố cổ - Mỹ Sơn" },
  { slug: "quang-ngai", name: "Quảng Ngãi", region: "Trung", desc: "Đảo Lý Sơn vương quốc tỏi" },
  { slug: "quang-ninh", name: "Quảng Ninh", region: "Bắc", desc: "Vịnh Hạ Long kỳ quan thế giới" },
  { slug: "quang-tri", name: "Quảng Trị", region: "Trung", desc: "Thành cổ và địa đạo Vịnh Mốc" },
  { slug: "soc-trang", name: "Sóc Trăng", region: "Nam", desc: "Chùa Dơi và lễ hội Ooc Om Bok" },
  { slug: "son-la", name: "Sơn La", region: "Bắc", desc: "Cao nguyên Mộc Châu mây phủ" },
  { slug: "tay-ninh", name: "Tây Ninh", region: "Nam", desc: "Núi Bà Đen linh thiêng" },
  { slug: "thai-binh", name: "Thái Bình", region: "Bắc", desc: "Chùa Keo - di sản kiến trúc" },
  { slug: "thai-nguyen", name: "Thái Nguyên", region: "Bắc", desc: "Đệ nhất danh trà Tân Cương" },
  { slug: "thanh-hoa", name: "Thanh Hóa", region: "Trung", desc: "Biển Sầm Sơn - Pù Luông" },
  { slug: "thua-thien-hue", name: "Thừa Thiên Huế", region: "Trung", desc: "Cố đô trầm mặc bên sông Hương" },
  { slug: "tien-giang", name: "Tiền Giang", region: "Nam", desc: "Chợ nổi Cái Bè miền Tây" },
  { slug: "tra-vinh", name: "Trà Vinh", region: "Nam", desc: "Ao Bà Om và chùa Khmer" },
  { slug: "tuyen-quang", name: "Tuyên Quang", region: "Bắc", desc: "Thủ đô kháng chiến Tân Trào" },
  { slug: "vinh-long", name: "Vĩnh Long", region: "Nam", desc: "Cù lao An Bình xanh mướt" },
  { slug: "vinh-phuc", name: "Vĩnh Phúc", region: "Bắc", desc: "Tam Đảo - thị trấn trong mây" },
  { slug: "yen-bai", name: "Yên Bái", region: "Bắc", desc: "Ruộng bậc thang Mù Cang Chải" },
];

const imgPool = [dalat, phuquoc, danang, nhatrang, hanoi, hcm];
const pickImg = (i: number) => imgPool[i % imgPool.length];

export const destinations: Destination[] = (() => {
  const list = [...baseDestinations];
  const existing = new Set(list.map((d) => d.name));
  provinceList.forEach((p, i) => {
    if (existing.has(p.name)) return;
    list.push({
      slug: p.slug,
      name: p.name,
      description: p.desc,
      fromPrice: 1_290_000 + ((i * 137_000) % 3_500_000),
      image: pickImg(i),
    });
  });
  return list;
})();

export type Tour = {
  id: string;
  title: string;
  destination: string;
  image: string;
  gallery?: string[];
  price: number;
  oldPrice?: number;
  days: number;
  nights: number;
  rating: number;
  reviews: number;
  stars: number;
  type: "Biển" | "Núi" | "Văn hóa" | "Thành phố";
  seatsLeft: number;
  schedule: { day: number; title: string; detail: string }[];
  included: string[];
  excluded: string[];
  description: string;
  videoUrl?: string;
};

export type HotelRoom = {
  id: string;
  name: string;
  tier: "standard" | "deluxe" | "vip";
  beds: number;
  bedType: string;
  basePeople: number;
  maxPeople: number;
  priceMultiplier: number;
  basePrice?: number;
  available: number;
  description: string;
  amenities?: string[];
  ownerEmail?: string;
};

export type Hotel = {
  id: string;
  name: string;
  address: string;
  city: string;
  price: number;
  rating: number;
  stars: number;
  image: string;
  gallery?: string[];
  amenities: string[];
  checkIn?: string;
  checkOut?: string;
  description?: string;
  roomDescription?: string;
  requirements?: string[];
  basePeople?: number;
  extraFeeRate?: number;
  rooms?: HotelRoom[];
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
};

export type Flight = {
  id: string;
  airline: string;
  from: string;
  to: string;
  depart: string;
  arrive: string;
  duration: string;
  price: number;
  baggage: string;
};

export type Airport = {
  code: string;
  name: string;
  city: string;
  region: "Bắc" | "Trung" | "Nam";
  intl: boolean;
};

export const airports: Airport[] = [
  { code: "HAN", name: "Sân bay Quốc tế Nội Bài", city: "Hà Nội", region: "Bắc", intl: true },
  { code: "VDO", name: "Sân bay Quốc tế Vân Đồn", city: "Quảng Ninh", region: "Bắc", intl: true },
  { code: "HPH", name: "Sân bay Quốc tế Cát Bi", city: "Hải Phòng", region: "Bắc", intl: true },
  { code: "HUI", name: "Sân bay Quốc tế Phú Bài", city: "Thừa Thiên Huế", region: "Trung", intl: true },
  { code: "DAD", name: "Sân bay Quốc tế Đà Nẵng", city: "Đà Nẵng", region: "Trung", intl: true },
  { code: "VCL", name: "Sân bay Quốc tế Chu Lai", city: "Quảng Nam", region: "Trung", intl: true },
  { code: "CXR", name: "Sân bay Quốc tế Cam Ranh", city: "Khánh Hòa", region: "Trung", intl: true },
  { code: "DLI", name: "Sân bay Quốc tế Liên Khương", city: "Lâm Đồng", region: "Trung", intl: true },
  { code: "SGN", name: "Sân bay Quốc tế Tân Sơn Nhất", city: "TP.HCM", region: "Nam", intl: true },
  { code: "PQC", name: "Sân bay Quốc tế Phú Quốc", city: "Kiên Giang", region: "Nam", intl: true },
  { code: "VCA", name: "Sân bay Quốc tế Cần Thơ", city: "Cần Thơ", region: "Nam", intl: true },
  { code: "VII", name: "Sân bay Quốc tế Vinh", city: "Nghệ An", region: "Trung", intl: true },
  { code: "DIN", name: "Sân bay Điện Biên Phủ", city: "Điện Biên", region: "Bắc", intl: false },
  { code: "THD", name: "Sân bay Thọ Xuân", city: "Thanh Hóa", region: "Bắc", intl: false },
  { code: "VDH", name: "Sân bay Đồng Hới", city: "Quảng Bình", region: "Trung", intl: false },
  { code: "UIH", name: "Sân bay Phù Cát", city: "Bình Định", region: "Trung", intl: false },
  { code: "PXU", name: "Sân bay Pleiku", city: "Gia Lai", region: "Trung", intl: false },
  { code: "TBB", name: "Sân bay Tuy Hòa", city: "Phú Yên", region: "Trung", intl: false },
  { code: "BMV", name: "Sân bay Buôn Ma Thuột", city: "Đắk Lắk", region: "Trung", intl: false },
  { code: "VCS", name: "Sân bay Côn Đảo", city: "Bà Rịa - Vũng Tàu", region: "Nam", intl: false },
  { code: "VKG", name: "Sân bay Rạch Giá", city: "Kiên Giang", region: "Nam", intl: false },
  { code: "CAH", name: "Sân bay Cà Mau", city: "Cà Mau", region: "Nam", intl: false },
];

// Promo banners (static placeholders — admin promos table can override later)
export const promos = [
  { title: "Flash Sale 50%", subtitle: "Ưu đãi tour biển hot nhất", color: "from-cyan-500 to-teal-500", href: "/tours?type=Biển" },
  { title: "Hè rực rỡ", subtitle: "Giảm 1tr cho tour biển", color: "from-amber-400 to-orange-500", href: "/tours?type=Biển" },
  { title: "Combo Bay + Khách sạn", subtitle: "Tiết kiệm tới 30%", color: "from-sky-500 to-indigo-500", href: "/flights" },
];

// =============================================================
// Live data arrays — populated from Supabase by adminStore.
// Components import these and re-render via useAdminVersion().
// =============================================================
export const tours: Tour[] = [];
export const hotels: Hotel[] = [];
export const flights: Flight[] = [];

export const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);

export const defaultHotelRequirements = [
  "Trẻ em dưới 6 tuổi miễn phí khi ngủ chung giường với bố mẹ",
  "Không hút thuốc trong phòng",
  "Không mang theo thú cưng",
  "Xuất trình CCCD/Hộ chiếu khi nhận phòng",
];

export function getHotelDescription(h: Pick<Hotel, "name" | "address" | "city" | "stars">) {
  const address = h.address?.trim() || `trung tâm ${h.city}`;
  return `${h.name} tọa lạc tại ${address}, là lựa chọn lý tưởng cho kỳ nghỉ tại ${h.city}. Khách sạn ${h.stars} sao có không gian lưu trú thoải mái, dịch vụ chuyên nghiệp, vị trí thuận tiện để di chuyển đến các điểm tham quan, khu ăn uống và trung tâm mua sắm trong khu vực.`;
}

export function hydrateHotelDetails<T extends Hotel>(h: T, idx = 0): T {
  if (!h.checkIn) h.checkIn = "14:00";
  if (!h.checkOut) h.checkOut = "12:00";
  if (!h.description?.trim()) h.description = getHotelDescription(h);
  if (!h.roomDescription)
    h.roomDescription = `Phòng rộng rãi 28-35m², giường King-size hoặc 2 giường đơn, view ${idx % 2 === 0 ? "biển/thành phố" : "núi/hồ bơi"}, ban công riêng, máy lạnh, TV LED 43", minibar, két sắt, phòng tắm đứng với đồ vệ sinh cao cấp.`;
  if (!h.requirements?.length) h.requirements = defaultHotelRequirements;
  if (!h.basePeople) h.basePeople = 2;
  if (h.extraFeeRate == null) h.extraFeeRate = 0.25;
  if (!h.amenities?.length) h.amenities = ["Wifi", "Nhà hàng", "Lễ tân 24h"];
  if (!h.rooms) {
    h.rooms = [
      { id: `${h.id}-r1`, name: "Standard Double", tier: "standard", beds: 1, bedType: "1 giường đôi Queen", basePeople: 2, maxPeople: 3, priceMultiplier: 1, available: 8 + (idx % 5), description: "Phòng tiêu chuẩn 25m², 1 giường Queen, view nội khu, đầy đủ tiện nghi cơ bản: máy lạnh, TV, minibar, phòng tắm đứng." },
      { id: `${h.id}-r2`, name: "Deluxe Twin", tier: "deluxe", beds: 2, bedType: "2 giường đơn Single", basePeople: 2, maxPeople: 4, priceMultiplier: 1.35, available: 5 + (idx % 4), description: "Phòng cao cấp 32m², 2 giường đơn rộng rãi phù hợp bạn bè/đồng nghiệp, view thành phố hoặc hồ bơi, ban công riêng, bồn tắm nằm." },
      { id: `${h.id}-r3`, name: "VIP Suite", tier: "vip", beds: 2, bedType: "1 giường King + 1 sofa giường", basePeople: 2, maxPeople: 5, priceMultiplier: 2.1, available: 2 + (idx % 3), description: "Suite hạng VIP 55m², phòng khách riêng, giường King-size cao cấp + sofa giường, view đẹp nhất khách sạn, bồn tắm Jacuzzi, minibar miễn phí, ưu tiên check-in/out." },
    ];
  }
  return h;
}
