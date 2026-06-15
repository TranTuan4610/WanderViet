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

export const destinations: Destination[] = [
  {
    slug: "da-lat",
    name: "Đà Lạt",
    description: "Thành phố ngàn hoa, sương mờ huyền ảo",
    fromPrice: 1_990_000,
    image: dalat,
  },
  {
    slug: "phu-quoc",
    name: "Phú Quốc",
    description: "Đảo ngọc biển xanh cát trắng",
    fromPrice: 3_490_000,
    image: phuquoc,
  },
  {
    slug: "da-nang",
    name: "Đà Nẵng",
    description: "Thành phố đáng sống bên sông Hàn",
    fromPrice: 2_690_000,
    image: danang,
  },
  {
    slug: "nha-trang",
    name: "Nha Trang",
    description: "Vịnh biển đẹp nhất Việt Nam",
    fromPrice: 2_390_000,
    image: nhatrang,
  },
  {
    slug: "ha-noi",
    name: "Hà Nội",
    description: "Thủ đô ngàn năm văn hiến",
    fromPrice: 1_790_000,
    image: hanoi,
  },
  {
    slug: "tp-hcm",
    name: "TP.HCM",
    description: "Hòn ngọc Viễn Đông sôi động",
    fromPrice: 1_690_000,
    image: hcm,
  },
];

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

const baseSchedule = [
  {
    day: 1,
    title: "Khởi hành",
    detail: "Xe đón đoàn tại điểm hẹn, di chuyển tới điểm đến, nhận phòng nghỉ ngơi.",
  },
  {
    day: 2,
    title: "Khám phá",
    detail: "Tham quan các điểm nổi bật, thưởng thức ẩm thực địa phương.",
  },
  { day: 3, title: "Trải nghiệm", detail: "Hoạt động vui chơi, mua sắm đặc sản." },
  {
    day: 4,
    title: "Trở về",
    detail: "Tự do mua sắm, lên xe trở về điểm hẹn ban đầu. Kết thúc tour.",
  },
];

export const tours: Tour[] = [
  {
    id: "t1",
    title: "Đà Lạt - Thành phố ngàn hoa",
    destination: "Đà Lạt",
    image: dalat,
    price: 2_990_000,
    oldPrice: 3_490_000,
    days: 3,
    nights: 2,
    rating: 4.8,
    reviews: 312,
    stars: 4,
    type: "Núi",
    seatsLeft: 8,
    schedule: baseSchedule.slice(0, 3),
    included: [
      "Xe du lịch đời mới",
      "Khách sạn 4 sao",
      "Vé tham quan",
      "HDV nhiệt tình",
      "Bảo hiểm du lịch",
    ],
    excluded: ["Đồ uống", "Chi phí cá nhân", "Tip HDV"],
    description:
      "Khám phá Đà Lạt mộng mơ với những đồi thông xanh ngát, hồ Tuyền Lâm thơ mộng và những vườn hoa rực rỡ.",
  },
  {
    id: "t2",
    title: "Phú Quốc - Đảo ngọc thiên đường",
    destination: "Phú Quốc",
    image: phuquoc,
    price: 2_700_000,
    oldPrice: 5_490_000,
    days: 4,
    nights: 3,
    rating: 4.9,
    reviews: 528,
    stars: 5,
    type: "Biển",
    seatsLeft: 5,
    schedule: baseSchedule,
    included: ["Vé máy bay khứ hồi", "Resort 5 sao", "Ăn 3 bữa", "Vé cáp treo Hòn Thơm", "HDV"],
    excluded: ["Đồ uống có cồn", "Spa", "Tip"],
    description:
      "Đặt chân tới đảo ngọc Phú Quốc - thiên đường nghỉ dưỡng với những bãi biển dài, nước biển trong vắt. Ưu đãi Flash Sale chỉ từ 2.7tr/khách!",
  },
  {
    id: "t3",
    title: "Đà Nẵng - Hội An - Bà Nà Hills",
    destination: "Đà Nẵng",
    image: danang,
    price: 3_790_000,
    days: 3,
    nights: 2,
    rating: 4.7,
    reviews: 421,
    stars: 4,
    type: "Thành phố",
    seatsLeft: 12,
    schedule: baseSchedule.slice(0, 3),
    included: ["Xe đời mới", "Khách sạn 4 sao view biển", "Vé Bà Nà", "Ăn 3 bữa", "HDV"],
    excluded: ["Vé máy bay", "Đồ uống", "Tip"],
    description: "Tour combo Đà Nẵng - Hội An - Bà Nà Hills, trải nghiệm Cầu Vàng huyền thoại.",
  },
  {
    id: "t4",
    title: "Nha Trang - Vinpearl Land",
    destination: "Nha Trang",
    image: nhatrang,
    price: 2_290_000,
    oldPrice: 3_290_000,
    days: 3,
    nights: 2,
    rating: 4.6,
    reviews: 287,
    stars: 4,
    type: "Biển",
    seatsLeft: 15,
    schedule: baseSchedule.slice(0, 3),
    included: ["Khách sạn 4 sao", "Vé Vinpearl", "Cáp treo", "Ăn 3 bữa", "HDV"],
    excluded: ["Vé máy bay", "Đồ uống", "Tip"],
    description:
      "Khám phá vịnh Nha Trang xinh đẹp và vui chơi tại thiên đường giải trí Vinpearl Land. Ưu đãi Hè rực rỡ - Giảm ngay 1tr!",
  },
  {
    id: "t5",
    title: "Hà Nội - Hạ Long - Sapa",
    destination: "Hà Nội",
    image: hanoi,
    price: 4_590_000,
    days: 5,
    nights: 4,
    rating: 4.8,
    reviews: 198,
    stars: 5,
    type: "Văn hóa",
    seatsLeft: 6,
    schedule: [
      ...baseSchedule,
      { day: 5, title: "Sapa", detail: "Chinh phục Fansipan, khám phá bản làng dân tộc." },
    ],
    included: ["Du thuyền Hạ Long", "Khách sạn 5 sao", "Vé cáp treo Fansipan", "Ăn các bữa", "HDV"],
    excluded: ["Đồ uống", "Tip"],
    description:
      "Tour miền Bắc trọn vẹn: thủ đô Hà Nội cổ kính, di sản Hạ Long và đỉnh Fansipan hùng vĩ.",
  },
  {
    id: "t6",
    title: "Sài Gòn - Miền Tây sông nước",
    destination: "TP.HCM",
    image: hcm,
    price: 2_290_000,
    oldPrice: 2_790_000,
    days: 3,
    nights: 2,
    rating: 4.5,
    reviews: 156,
    stars: 4,
    type: "Văn hóa",
    seatsLeft: 20,
    schedule: baseSchedule.slice(0, 3),
    included: ["Xe du lịch", "Khách sạn 3 sao", "Thuyền sông nước", "Ăn 3 bữa", "HDV"],
    excluded: ["Vé máy bay", "Đồ uống", "Tip"],
    description: "Khám phá Sài Gòn náo nhiệt và miền Tây sông nước mênh mang.",
  },
];

export const promos = [
  {
    title: "Flash Sale 50%",
    subtitle: "Tour Phú Quốc chỉ từ 2.7tr",
    color: "from-cyan-500 to-teal-500",
    href: "/tours/t2",
  },
  {
    title: "Hè rực rỡ",
    subtitle: "Giảm 1tr cho tour biển",
    color: "from-amber-400 to-orange-500",
    href: "/tours?type=Biển",
  },
  {
    title: "Combo Bay+Khách sạn",
    subtitle: "Tiết kiệm tới 30%",
    color: "from-sky-500 to-indigo-500",
    href: "/flights?combo=hotel",
  },
];

export type HotelRoom = {
  id: string;
  name: string;
  tier: "standard" | "deluxe" | "vip";
  beds: number;
  bedType: string;
  basePeople: number;
  maxPeople: number;
  priceMultiplier: number; // nhân với hotel.price
  available: number;
  description: string;
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
  basePeople?: number; // số khách bao gồm trong giá; mỗi khách dư cộng thêm extraFeeRate * price
  extraFeeRate?: number; // ví dụ 0.25 = +25% giá/đêm cho mỗi khách dư
  rooms?: HotelRoom[];
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
};

export const hotels: Hotel[] = [
  {
    id: "h1",
    name: "Vinpearl Resort Phú Quốc",
    address: "Bãi Dài, Phú Quốc",
    city: "Phú Quốc",
    price: 3_200_000,
    rating: 4.8,
    stars: 5,
    image: phuquoc,
    amenities: ["Hồ bơi", "Bãi biển riêng", "Spa", "Gym", "Wifi"],
  },
  {
    id: "h2",
    name: "Ana Mandara Đà Lạt",
    address: "Lê Lai, Đà Lạt",
    city: "Đà Lạt",
    price: 2_100_000,
    rating: 4.7,
    stars: 5,
    image: dalat,
    amenities: ["View núi", "Nhà hàng", "Spa", "Wifi"],
  },
  {
    id: "h3",
    name: "InterContinental Đà Nẵng",
    address: "Bán đảo Sơn Trà",
    city: "Đà Nẵng",
    price: 5_500_000,
    rating: 4.9,
    stars: 5,
    image: danang,
    amenities: ["Bãi biển riêng", "Hồ bơi", "Spa", "Gym", "Wifi"],
  },
  {
    id: "h4",
    name: "Sheraton Nha Trang",
    address: "Trần Phú, Nha Trang",
    city: "Nha Trang",
    price: 2_800_000,
    rating: 4.6,
    stars: 5,
    image: nhatrang,
    amenities: ["Hồ bơi", "View biển", "Gym", "Wifi"],
  },
  {
    id: "h5",
    name: "Sofitel Legend Metropole Hà Nội",
    address: "Ngô Quyền, Hà Nội",
    city: "Hà Nội",
    price: 4_900_000,
    rating: 4.9,
    stars: 5,
    image: hanoi,
    amenities: ["Cổ điển", "Spa", "Nhà hàng Pháp", "Wifi"],
  },
  {
    id: "h6",
    name: "Hotel des Arts Saigon",
    address: "Quận 3, TP.HCM",
    city: "TP.HCM",
    price: 3_400_000,
    rating: 4.7,
    stars: 5,
    image: hcm,
    amenities: ["View thành phố", "Hồ bơi", "Spa", "Wifi"],
  },
];

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
  // Miền Bắc - Quốc tế
  { code: "HAN", name: "Sân bay Quốc tế Nội Bài", city: "Hà Nội", region: "Bắc", intl: true },
  { code: "VDO", name: "Sân bay Quốc tế Vân Đồn", city: "Quảng Ninh", region: "Bắc", intl: true },
  { code: "HPH", name: "Sân bay Quốc tế Cát Bi", city: "Hải Phòng", region: "Bắc", intl: true },
  // Miền Trung & Tây Nguyên - Quốc tế
  {
    code: "HUI",
    name: "Sân bay Quốc tế Phú Bài",
    city: "Thừa Thiên Huế",
    region: "Trung",
    intl: true,
  },
  { code: "DAD", name: "Sân bay Quốc tế Đà Nẵng", city: "Đà Nẵng", region: "Trung", intl: true },
  { code: "VCL", name: "Sân bay Quốc tế Chu Lai", city: "Quảng Nam", region: "Trung", intl: true },
  { code: "CXR", name: "Sân bay Quốc tế Cam Ranh", city: "Khánh Hòa", region: "Trung", intl: true },
  {
    code: "DLI",
    name: "Sân bay Quốc tế Liên Khương",
    city: "Lâm Đồng",
    region: "Trung",
    intl: true,
  },
  // Miền Nam - Quốc tế
  { code: "SGN", name: "Sân bay Quốc tế Tân Sơn Nhất", city: "TP.HCM", region: "Nam", intl: true },
  { code: "PQC", name: "Sân bay Quốc tế Phú Quốc", city: "Kiên Giang", region: "Nam", intl: true },
  { code: "VCA", name: "Sân bay Quốc tế Cần Thơ", city: "Cần Thơ", region: "Nam", intl: true },
  { code: "VII", name: "Sân bay Quốc tế Vinh", city: "Nghệ An", region: "Trung", intl: true },
  // Nội địa - Miền Bắc
  { code: "DIN", name: "Sân bay Điện Biên Phủ", city: "Điện Biên", region: "Bắc", intl: false },
  { code: "THD", name: "Sân bay Thọ Xuân", city: "Thanh Hóa", region: "Bắc", intl: false },
  // Nội địa - Miền Trung & Tây Nguyên
  { code: "VDH", name: "Sân bay Đồng Hới", city: "Quảng Bình", region: "Trung", intl: false },
  { code: "UIH", name: "Sân bay Phù Cát", city: "Bình Định", region: "Trung", intl: false },
  { code: "PXU", name: "Sân bay Pleiku", city: "Gia Lai", region: "Trung", intl: false },
  { code: "TBB", name: "Sân bay Tuy Hòa", city: "Phú Yên", region: "Trung", intl: false },
  { code: "BMV", name: "Sân bay Buôn Ma Thuột", city: "Đắk Lắk", region: "Trung", intl: false },
  // Nội địa - Miền Nam
  { code: "VCS", name: "Sân bay Côn Đảo", city: "Bà Rịa - Vũng Tàu", region: "Nam", intl: false },
  { code: "VKG", name: "Sân bay Rạch Giá", city: "Kiên Giang", region: "Nam", intl: false },
  { code: "CAH", name: "Sân bay Cà Mau", city: "Cà Mau", region: "Nam", intl: false },
];

export const flights: Flight[] = [
  {
    id: "f1",
    airline: "Vietnam Airlines",
    from: "HAN",
    to: "SGN",
    depart: "06:00",
    arrive: "08:15",
    duration: "2h 15m",
    price: 1_890_000,
    baggage: "23kg",
  },
  {
    id: "f2",
    airline: "Bamboo Airways",
    from: "HAN",
    to: "SGN",
    depart: "09:30",
    arrive: "11:50",
    duration: "2h 20m",
    price: 1_650_000,
    baggage: "20kg",
  },
  {
    id: "f3",
    airline: "Vietjet Air",
    from: "HAN",
    to: "SGN",
    depart: "14:00",
    arrive: "16:10",
    duration: "2h 10m",
    price: 990_000,
    baggage: "7kg xách tay",
  },
  {
    id: "f4",
    airline: "Vietnam Airlines",
    from: "SGN",
    to: "DAD",
    depart: "07:00",
    arrive: "08:25",
    duration: "1h 25m",
    price: 1_490_000,
    baggage: "23kg",
  },
  {
    id: "f5",
    airline: "Vietjet Air",
    from: "SGN",
    to: "PQC",
    depart: "10:00",
    arrive: "11:05",
    duration: "1h 05m",
    price: 890_000,
    baggage: "7kg xách tay",
  },
];

export const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(n);

// ============================================================
// Mở rộng dữ liệu: phủ 64 tỉnh/thành Việt Nam (mock)
// ============================================================

const provinceList: {
  slug: string;
  name: string;
  region: "Bắc" | "Trung" | "Nam";
  desc: string;
}[] = [
  { slug: "ha-noi", name: "Hà Nội", region: "Bắc", desc: "Thủ đô ngàn năm văn hiến" },
  { slug: "tp-hcm", name: "TP.HCM", region: "Nam", desc: "Hòn ngọc Viễn Đông sôi động" },
  { slug: "da-nang", name: "Đà Nẵng", region: "Trung", desc: "Thành phố đáng sống bên sông Hàn" },
  { slug: "hai-phong", name: "Hải Phòng", region: "Bắc", desc: "Thành phố hoa phượng đỏ" },
  { slug: "can-tho", name: "Cần Thơ", region: "Nam", desc: "Tây Đô miền sông nước" },
  {
    slug: "an-giang",
    name: "An Giang",
    region: "Nam",
    desc: "Rừng tràm Trà Sư và núi Cấm linh thiêng",
  },
  {
    slug: "ba-ria-vung-tau",
    name: "Bà Rịa - Vũng Tàu",
    region: "Nam",
    desc: "Biển xanh gần Sài Gòn",
  },
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
  {
    slug: "thua-thien-hue",
    name: "Thừa Thiên Huế",
    region: "Trung",
    desc: "Cố đô trầm mặc bên sông Hương",
  },
  { slug: "tien-giang", name: "Tiền Giang", region: "Nam", desc: "Chợ nổi Cái Bè miền Tây" },
  { slug: "tra-vinh", name: "Trà Vinh", region: "Nam", desc: "Ao Bà Om và chùa Khmer" },
  { slug: "tuyen-quang", name: "Tuyên Quang", region: "Bắc", desc: "Thủ đô kháng chiến Tân Trào" },
  { slug: "vinh-long", name: "Vĩnh Long", region: "Nam", desc: "Cù lao An Bình xanh mướt" },
  { slug: "vinh-phuc", name: "Vĩnh Phúc", region: "Bắc", desc: "Tam Đảo - thị trấn trong mây" },
  { slug: "yen-bai", name: "Yên Bái", region: "Bắc", desc: "Ruộng bậc thang Mù Cang Chải" },
  {
    slug: "bac-can-2",
    name: "Bình Thuận - Phan Thiết",
    region: "Trung",
    desc: "Bãi biển và resort sang trọng",
  },
];

const imgPool = [dalat, phuquoc, danang, nhatrang, hanoi, hcm];
const pickImg = (i: number) => imgPool[i % imgPool.length];
const tourTypeByRegion: Record<string, Tour["type"]> = {
  Bắc: "Núi",
  Trung: "Biển",
  Nam: "Văn hóa",
};

const tourTitleTemplates = [
  "Khám phá",
  "Hành trình",
  "Trải nghiệm",
  "Du ngoạn",
  "Về với",
  "Mùa đẹp ở",
];

// Bổ sung destinations còn thiếu (cycle ảnh)
const existingNames = new Set(destinations.map((d) => d.name));
provinceList.forEach((p, i) => {
  if (existingNames.has(p.name)) return;
  destinations.push({
    slug: p.slug,
    name: p.name,
    description: p.desc,
    fromPrice: 1_290_000 + ((i * 137_000) % 3_500_000),
    image: pickImg(i),
  });
});

// Sinh ~100 tours mới phủ 64 tỉnh (mỗi tỉnh 1-2 tour)
let tourCounter = tours.length;
provinceList.forEach((p, i) => {
  const variants = i % 3 === 0 ? 2 : 1;
  for (let v = 0; v < variants; v++) {
    tourCounter += 1;
    const days = 2 + ((i + v) % 5);
    const price = 1_490_000 + ((i * 211 + v * 333) % 18) * 250_000;
    const stars = 3 + ((i + v) % 3);
    const rating = Math.round((4.3 + ((i + v) % 7) * 0.08) * 10) / 10;
    const reviews = 60 + ((i * 17 + v * 41) % 480);
    tours.push({
      id: `t${tourCounter}`,
      title: `${tourTitleTemplates[(i + v) % tourTitleTemplates.length]} ${p.name}`,
      destination: p.name,
      image: pickImg(i + v),
      price,
      oldPrice: v === 0 ? price + 400_000 : undefined,
      days,
      nights: Math.max(1, days - 1),
      rating: Math.min(5, rating),
      reviews,
      stars,
      type: tourTypeByRegion[p.region],
      seatsLeft: 3 + ((i + v * 5) % 18),
      schedule: baseSchedule.slice(0, Math.min(4, days)),
      included: ["Xe du lịch", `Khách sạn ${stars} sao`, "Vé tham quan", "HDV", "Bảo hiểm"],
      excluded: ["Đồ uống", "Chi phí cá nhân", "Tip HDV"],
      description: `${p.desc}. Tour ${days} ngày ${Math.max(1, days - 1)} đêm khám phá ${p.name} cùng WanderViet.`,
    });
  }
});

// Sinh hotels phủ 64 tỉnh thành (mỗi tỉnh 1 khách sạn)
const hotelBrands = [
  "Mường Thanh",
  "Vinpearl",
  "Saigontourist",
  "Melia",
  "Lotte",
  "Pullman",
  "Wyndham",
  "Best Western",
  "Novotel",
  "Sojo",
];
let hotelCounter = hotels.length;
provinceList.forEach((p, i) => {
  if (hotels.some((h) => h.city === p.name)) return;
  hotelCounter += 1;
  const stars = 3 + (i % 3);
  hotels.push({
    id: `h${hotelCounter}`,
    name: `${hotelBrands[i % hotelBrands.length]} ${p.name}`,
    address: `Trung tâm ${p.name}`,
    city: p.name,
    price: 690_000 + ((i * 173_000) % 3_800_000),
    rating: Math.round((4.2 + (i % 8) * 0.08) * 10) / 10,
    stars,
    image: pickImg(i + 2),
    amenities: ["Wifi", "Hồ bơi", "Nhà hàng", stars >= 4 ? "Spa" : "Gym"],
  });
});

// Bổ sung detail cho mọi hotel
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
      {
        id: `${h.id}-r1`,
        name: "Standard Double",
        tier: "standard",
        beds: 1,
        bedType: "1 giường đôi Queen",
        basePeople: 2,
        maxPeople: 3,
        priceMultiplier: 1,
        available: 8 + (idx % 5),
        description:
          "Phòng tiêu chuẩn 25m², 1 giường Queen, view nội khu, đầy đủ tiện nghi cơ bản: máy lạnh, TV, minibar, phòng tắm đứng.",
      },
      {
        id: `${h.id}-r2`,
        name: "Deluxe Twin",
        tier: "deluxe",
        beds: 2,
        bedType: "2 giường đơn Single",
        basePeople: 2,
        maxPeople: 4,
        priceMultiplier: 1.35,
        available: 5 + (idx % 4),
        description:
          "Phòng cao cấp 32m², 2 giường đơn rộng rãi phù hợp bạn bè/đồng nghiệp, view thành phố hoặc hồ bơi, ban công riêng, bồn tắm nằm.",
      },
      {
        id: `${h.id}-r3`,
        name: "VIP Suite",
        tier: "vip",
        beds: 2,
        bedType: "1 giường King + 1 sofa giường",
        basePeople: 2,
        maxPeople: 5,
        priceMultiplier: 2.1,
        available: 2 + (idx % 3),
        description:
          "Suite hạng VIP 55m², phòng khách riêng, giường King-size cao cấp + sofa giường, view đẹp nhất khách sạn, bồn tắm Jacuzzi, minibar miễn phí, ưu tiên check-in/out.",
      },
    ];
  }
  return h;
}

hotels.forEach((h, idx) => {
  hydrateHotelDetails(h, idx);
});

// Sinh thêm chuyến bay phủ tất cả sân bay mới
const airlines = ["Vietnam Airlines", "Vietjet Air", "Bamboo Airways", "Vietravel Airlines"];
const times = [
  { d: "05:30", a: "07:00", dur: "1h 30m" },
  { d: "08:00", a: "09:45", dur: "1h 45m" },
  { d: "11:15", a: "13:20", dur: "2h 05m" },
  { d: "15:00", a: "16:40", dur: "1h 40m" },
  { d: "18:30", a: "20:25", dur: "1h 55m" },
];
let fCounter = flights.length;
const hubs = ["HAN", "SGN", "DAD"];
airports.forEach((ap, i) => {
  if (hubs.includes(ap.code)) return;
  hubs.forEach((hub, hi) => {
    fCounter += 1;
    const t = times[(i + hi) % times.length];
    const al = airlines[(i + hi) % airlines.length];
    const price = 690_000 + ((i * 137 + hi * 250) % 16) * 90_000;
    flights.push({
      id: `f${fCounter}`,
      airline: al,
      from: hub,
      to: ap.code,
      depart: t.d,
      arrive: t.a,
      duration: t.dur,
      price,
      baggage: al === "Vietjet Air" ? "7kg xách tay" : "23kg",
    });
  });
});

// Sinh thêm 100 chuyến bay đa dạng (khứ hồi giữa các sân bay, nhiều khung giờ)
const extraTimes = [
  { d: "06:00", a: "07:35", dur: "1h 35m" },
  { d: "07:20", a: "09:10", dur: "1h 50m" },
  { d: "09:45", a: "11:30", dur: "1h 45m" },
  { d: "10:30", a: "12:20", dur: "1h 50m" },
  { d: "12:00", a: "13:55", dur: "1h 55m" },
  { d: "13:40", a: "15:20", dur: "1h 40m" },
  { d: "14:25", a: "16:15", dur: "1h 50m" },
  { d: "16:10", a: "18:05", dur: "1h 55m" },
  { d: "17:30", a: "19:10", dur: "1h 40m" },
  { d: "19:45", a: "21:30", dur: "1h 45m" },
  { d: "20:50", a: "22:40", dur: "1h 50m" },
  { d: "22:15", a: "23:55", dur: "1h 40m" },
];
let added = 0;
let idx = 0;
while (added < 100) {
  const from = airports[idx % airports.length];
  const to = airports[(idx * 7 + 3) % airports.length];
  idx += 1;
  if (from.code === to.code) continue;
  const t = extraTimes[added % extraTimes.length];
  const al = airlines[(added + 2) % airlines.length];
  const price = 590_000 + ((added * 173) % 22) * 80_000;
  fCounter += 1;
  flights.push({
    id: `f${fCounter}`,
    airline: al,
    from: from.code,
    to: to.code,
    depart: t.d,
    arrive: t.a,
    duration: t.dur,
    price,
    baggage: al === "Vietjet Air" ? "7kg xách tay" : "23kg",
  });
  added += 1;
}
