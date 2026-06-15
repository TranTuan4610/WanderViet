// Bản đồ video YouTube giới thiệu theo điểm đến (đã chọn lọc các video du lịch chính thống/phổ biến).
// Khi không khớp điểm đến, dùng video du lịch Việt Nam mặc định.

const DESTINATION_VIDEOS: Record<string, string> = {
  "da lat": "0_pmgDd9uoA",
  "dalat": "0_pmgDd9uoA",
  "phu quoc": "0h2igeLvp-w",
  "da nang": "dZV_tx9jLdo",
  "danang": "dZV_tx9jLdo",
  "hoi an": "i16fuJZB0nU",
  "hoian": "i16fuJZB0nU",
  "nha trang": "K6D2qYSJP0g",
  "ha noi": "u9VswvjJtfI",
  "hanoi": "u9VswvjJtfI",
  "tp hcm": "D7F6pTXmvWw",
  "ho chi minh": "D7F6pTXmvWw",
  "sai gon": "D7F6pTXmvWw",
  "sapa": "KuKHih_QwhM",
  "sa pa": "KuKHih_QwhM",
  "ha long": "XRUw6-GoS24",
  "halong": "XRUw6-GoS24",
  "hue": "PFKpciEC-fQ",
  "ninh binh": "DrqiWJB7hBg",
  "phan thiet": "WmYNQ5CzoFI",
  "mui ne": "WmYNQ5CzoFI",
  "quy nhon": "W_rLSlGYxVo",
  "vung tau": "4kv5ps7S3hg",
  "can tho": "aFL5Ygr0idM",
  "moc chau": "qc6X15xZzkE",
  "ha giang": "7qY_IB5vvQA",
  "con dao": "TtZy9TI5MEk",
};

// Video mặc định: Vietnam travel guide
const DEFAULT_VIDEO_ID = "rbNZbC2IqLs";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getTourVideoId(destination: string, tourId?: string): string {
  const key = normalize(destination);
  if (DESTINATION_VIDEOS[key]) return DESTINATION_VIDEOS[key];
  for (const k of Object.keys(DESTINATION_VIDEOS)) {
    if (key.includes(k) || k.includes(key)) return DESTINATION_VIDEOS[k];
  }
  void tourId;
  return DEFAULT_VIDEO_ID;
}

export function getTourVideoEmbedUrl(destination: string, tourId?: string, customUrl?: string): string {
  if (customUrl && customUrl.trim()) {
    const url = customUrl.trim();
    if (/\/embed\//.test(url)) return url;
    const short = url.match(/youtu\.be\/([\w-]{6,})/);
    if (short) return `https://www.youtube-nocookie.com/embed/${short[1]}?rel=0&modestbranding=1`;
    const watch = url.match(/[?&]v=([\w-]{6,})/);
    if (watch) return `https://www.youtube-nocookie.com/embed/${watch[1]}?rel=0&modestbranding=1`;
    const shorts = url.match(/shorts\/([\w-]{6,})/);
    if (shorts) return `https://www.youtube-nocookie.com/embed/${shorts[1]}?rel=0&modestbranding=1`;
    if (/^[\w-]{11}$/.test(url)) return `https://www.youtube-nocookie.com/embed/${url}?rel=0&modestbranding=1`;
    return url;
  }
  const id = getTourVideoId(destination, tourId);
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`;
}
