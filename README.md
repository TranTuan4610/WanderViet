# WanderViet - Website đặt tour, khách sạn, vé máy bay và dịch vụ du lịch

WanderViet là website du lịch hỗ trợ khách hàng tìm kiếm, đặt tour, đặt khách sạn, đặt vé máy bay, thuê xe và quản lý các dịch vụ du lịch trực tuyến. Dự án được xây dựng bằng React 19, TanStack Router, TanStack Start, TypeScript, Tailwind CSS 4, Supabase và các thành phần giao diện hiện đại. Website có giao diện tiếng Việt, hỗ trợ đa ngôn ngữ, chế độ sáng/tối, luồng đặt dịch vụ, quản trị dữ liệu, thanh toán QR/SePay, AI chat tư vấn và widget liên hệ nổi gồm Zalo, Messenger, gọi điện.

## Demo trực tuyến

Website triển khai tại domain:

```txt
https://tranvantuanwanderviet.shop
```

Trang người dùng:

```txt
https://tranvantuanwanderviet.shop
```

Trang quản trị:

```txt
https://tranvantuanwanderviet.shop/admin
```

## Mục lục

1. [Tính năng chính](#1-tính-năng-chính)
2. [Công nghệ sử dụng](#2-công-nghệ-sử-dụng)
3. [Yêu cầu hệ thống](#3-yêu-cầu-hệ-thống)
4. [Cài đặt nhanh](#4-cài-đặt-nhanh)
5. [Biến môi trường](#5-biến-môi-trường)
6. [Cơ sở dữ liệu](#6-cơ-sở-dữ-liệu)
7. [Thanh toán SePay và QR ngân hàng](#7-thanh-toán-sepay-và-qr-ngân-hàng)
8. [AI Chat và widget liên hệ](#8-ai-chat-và-widget-liên-hệ)
9. [Đa ngôn ngữ, giao diện sáng/tối và hiệu ứng](#9-đa-ngôn-ngữ-giao-diện-sángtối-và-hiệu-ứng)
10. [Các lệnh thường dùng](#10-các-lệnh-thường-dùng)
11. [Cấu trúc thư mục](#11-cấu-trúc-thư-mục)
12. [Tài khoản và quyền quản trị](#12-tài-khoản-và-quyền-quản-trị)
13. [Triển khai production](#13-triển-khai-production)
14. [Ghi chú bảo trì](#14-ghi-chú-bảo-trì)

---

# 1. Tính năng chính

## 1.1. Website khách hàng

Website khách hàng của WanderViet cung cấp các trang chính phục vụ nhu cầu du lịch:

* Trang chủ giới thiệu thương hiệu WanderViet, điểm đến nổi bật, tour nổi bật, khách sạn, dịch vụ thuê xe và các tiện ích du lịch.
* Trang danh sách tour du lịch với hình ảnh, mô tả, giá, điểm đến và thông tin chi tiết.
* Trang chi tiết tour hiển thị lịch trình, giá, ảnh đại diện, gallery, video, dịch vụ bao gồm và không bao gồm.
* Trang khách sạn hiển thị danh sách khách sạn, thông tin phòng, giá theo đêm, số sao, điều kiện nhận phòng và trả phòng.
* Trang chi tiết khách sạn cho phép xem thông tin phòng, tiện nghi, gallery, mô tả và đặt phòng.
* Trang vé máy bay hiển thị chuyến bay, hãng bay, điểm đi, điểm đến, giờ khởi hành, giờ đến, thời lượng, hành lý và giá vé.
* Trang thuê xe hỗ trợ hiển thị dịch vụ thuê xe, loại xe, giá thuê và thông tin liên hệ.
* Trang đăng chỗ nghỉ dành cho chủ khách sạn hoặc đối tác muốn đăng dịch vụ lên hệ thống.
* Trang hồ sơ người dùng để xem thông tin tài khoản, booking và dữ liệu cá nhân.
* Form đăng nhập, đăng ký, quên mật khẩu và đặt lại mật khẩu.
* Widget liên hệ nổi gồm Zalo, Messenger/Facebook, gọi điện và AI Chat.

## 1.2. Đặt dịch vụ

Hệ thống có luồng đặt dịch vụ cho nhiều loại sản phẩm du lịch:

* Đặt tour du lịch.
* Đặt khách sạn/phòng.
* Đặt vé máy bay.
* Đặt dịch vụ thuê xe.
* Nhập thông tin khách hàng.
* Nhập danh sách khách đi cùng.
* Nhập căn cước công dân, số điện thoại, email và thông tin liên hệ.
* Chọn phương thức thanh toán.
* Tạo booking ở trạng thái chờ thanh toán.
* Theo dõi trạng thái booking.
* Xác nhận thanh toán thông qua webhook SePay hoặc cơ chế xác nhận dự phòng.
* Lưu thông tin booking vào Supabase.

Các loại booking trong hệ thống gồm:

```txt
tour
hotel
flight
rental
```

## 1.3. Thanh toán

Dự án có hỗ trợ thanh toán theo hướng:

* Thanh toán QR ngân hàng.
* Thanh toán qua SePay webhook.
* Mã nội dung chuyển khoản gắn với booking.
* API webhook nhận tín hiệu thanh toán.
* Kiểm tra chữ ký webhook bằng secret.
* Cập nhật trạng thái booking sau khi thanh toán.
* Tăng lượt sử dụng voucher nếu booking có áp dụng mã giảm giá.
* Gửi email thông báo booking cho khách hàng hoặc chủ dịch vụ nếu có cấu hình email.

Các route/API liên quan:

```txt
src/routes/api/sepay/webhook.ts
src/routes/api/public/payment-callback.ts
src/lib/booking.functions.ts
src/lib/booking.server.ts
```

## 1.4. Admin dashboard

Khu vực quản trị hỗ trợ quản lý các dữ liệu chính của hệ thống:

* Dashboard tổng quan doanh thu, đơn hàng, khách hàng và tỷ lệ chuyển đổi.
* Biểu đồ doanh thu theo tháng bằng Recharts.
* Quản lý booking.
* Lọc booking theo trạng thái, loại dịch vụ và từ khóa.
* Cập nhật trạng thái booking: pending, paid, cancelled, refunded.
* Gửi lại email booking.
* Quản lý tour du lịch.
* Quản lý khách sạn.
* Quản lý vé máy bay.
* Quản lý thuê xe.
* Quản lý voucher/khuyến mãi.
* Quản lý người dùng.
* Kiểm tra quyền admin thông qua Supabase role.
* Một số thao tác admin chạy qua TanStack Server Functions.

Các trang admin chính:

```txt
src/routes/admin.tsx
src/routes/admin.index.tsx
src/routes/admin.bookings.tsx
src/routes/admin.tours.tsx
src/routes/admin.hotels.tsx
src/routes/admin.flights.tsx
src/routes/admin.rentals.tsx
src/routes/admin.promos.tsx
src/routes/admin.users.tsx
```

## 1.5. Tài khoản người dùng

Dự án sử dụng Supabase Auth để xử lý đăng ký, đăng nhập và phiên làm việc.

Chức năng tài khoản gồm:

* Đăng ký tài khoản bằng email, mật khẩu, tên và số điện thoại.
* Đăng nhập bằng email và mật khẩu.
* Đăng xuất.
* Quên mật khẩu.
* Đặt lại mật khẩu.
* Lưu hồ sơ người dùng trong bảng profiles.
* Gán vai trò user/admin trong bảng user_roles.
* Phân quyền admin qua role admin.
* Quản lý yêu thích với bảng favorites.
* Quản lý đánh giá với bảng reviews.

## 1.6. Đánh giá và yêu thích

Hệ thống có các bảng hỗ trợ trải nghiệm người dùng:

* favorites: lưu tour/khách sạn yêu thích của từng người dùng.
* reviews: lưu đánh giá theo booking.
* Mỗi đánh giá có rating từ 1 đến 5 sao.
* Người dùng chỉ được thao tác dữ liệu của chính mình.
* Admin có thể xem dữ liệu tổng quan tùy theo chính sách RLS.

## 1.7. Email

Dự án có hạ tầng email nội bộ trong Supabase:

* Queue email xác thực.
* Queue email giao dịch.
* Bảng log email.
* Bảng trạng thái gửi email.
* Bảng email bị chặn/suppression.
* Token hủy đăng ký nhận email.
* Các route hỗ trợ gửi, preview, process email.

Các route liên quan:

```txt
src/routes/lovable/email/queue/process.ts
src/routes/lovable/email/suppression.ts
src/routes/lovable/email/transactional/preview.ts
src/routes/lovable/email/transactional/send.ts
src/routes/email/unsubscribe.ts
src/routes/unsubscribe.tsx
```

---

# 2. Công nghệ sử dụng

Dự án WanderViet sử dụng các công nghệ chính sau:

```txt
React 19
TypeScript
Vite
TanStack Router
TanStack Start
TanStack React Query
Tailwind CSS 4
Supabase
Supabase Auth
Supabase Database
Supabase Row Level Security
Framer Motion
Lucide React
Radix UI
shadcn/ui style components
React Hook Form
Zod
Sonner
Recharts
date-fns
Cloudflare Vite Plugin
```

Các thư viện giao diện và UI:

```txt
@radix-ui/react-dialog
@radix-ui/react-dropdown-menu
@radix-ui/react-select
@radix-ui/react-tabs
@radix-ui/react-tooltip
@radix-ui/react-navigation-menu
lucide-react
class-variance-authority
clsx
tailwind-merge
tw-animate-css
vaul
embla-carousel-react
```

Các thư viện dữ liệu và form:

```txt
@tanstack/react-query
@tanstack/react-router
@tanstack/react-start
react-hook-form
@hookform/resolvers
zod
```

Các thư viện email:

```txt
@lovable.dev/email-js
@lovable.dev/webhooks-js
@react-email/components
react-email
```

---

# 3. Yêu cầu hệ thống

Để chạy dự án ở local, cần chuẩn bị:

```txt
Node.js 20 LTS hoặc mới hơn
npm hoặc bun
Tài khoản Supabase
Supabase project URL
Supabase publishable key
Supabase service role key cho server/admin
```

Khuyến nghị cho production:

```txt
Domain thật, ví dụ https://tranvantuanwanderviet.shop
Supabase production project
SePay webhook secret
Cloudflare hoặc nền tảng deploy hỗ trợ Vite/TanStack Start
HTTPS bắt buộc cho thanh toán và auth
```

---

# 4. Cài đặt nhanh

Cài dependencies:

```bash
npm install
```

Chạy development server:

```bash
npm run dev
```

Build production:

```bash
npm run build
```

Chạy preview bản build:

```bash
npm run preview
```

Kiểm tra lint:

```bash
npm run lint
```

Format code:

```bash
npm run format
```

Nếu dùng Bun:

```bash
bun install
bun run dev
```

Sau khi chạy local, mở website tại địa chỉ Vite hiển thị trong terminal, thường là:

```txt
http://localhost:3000
```

---

# 5. Biến môi trường

File mẫu hiện có:

```txt
.env.example
```

Trong file hiện tại có các biến cho SePay và site:

```env
PAYMENT_CALLBACK_SECRET=
SEPAY_WEBHOOK_SECRET=

SEPAY_BANK_NAME=TPBank
SEPAY_BANK_ACCOUNT=0865665046
SEPAY_BANK_OWNER=WANDERVIET TRAVEL

PUBLIC_SITE_URL=https://tranvantuanwanderviet.shop
```

Ngoài ra, vì dự án dùng Supabase, cần bổ sung các biến sau khi chạy ngoài Lovable Cloud:

```env
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Biến dành cho mở khóa quyền admin:

```env
ADMIN_ACCESS_PASSWORD=your-strong-admin-password
```

Nếu không cấu hình `ADMIN_ACCESS_PASSWORD`, code hiện tại có fallback mặc định là:

```txt
123456789
```

Khi deploy production, bắt buộc nên đổi mật khẩu admin mặc định bằng biến môi trường riêng.

Ví dụ file `.env` production:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

PUBLIC_SITE_URL=https://tranvantuanwanderviet.shop

PAYMENT_CALLBACK_SECRET=your-long-random-secret
SEPAY_WEBHOOK_SECRET=your-long-random-secret

SEPAY_BANK_NAME=TPBank
SEPAY_BANK_ACCOUNT=0865665046
SEPAY_BANK_OWNER=WANDERVIET TRAVEL

ADMIN_ACCESS_PASSWORD=change-this-before-production
```

Lưu ý:

* Không commit file `.env` lên GitHub.
* `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng phía server, tuyệt đối không đưa ra client.
* `VITE_SUPABASE_PUBLISHABLE_KEY` có thể dùng phía client.
* `PAYMENT_CALLBACK_SECRET` và `SEPAY_WEBHOOK_SECRET` nên đặt cùng một giá trị nếu webhook dùng chung secret.
* `PUBLIC_SITE_URL` nên trỏ đúng domain thật để SEO, metadata và callback hoạt động đúng.

---

# 6. Cơ sở dữ liệu

Dự án dùng Supabase PostgreSQL. Các migration nằm tại:

```txt
supabase/migrations/
```

Các bảng chính trong hệ thống:

```txt
profiles
user_roles
tours
hotels
hotel_rooms
flights
bookings
vouchers
reviews
favorites
content_posts
email_logs
email_send_log
email_send_state
suppressed_emails
email_unsubscribe_tokens
```

## 6.1. Bảng profiles

Lưu thông tin hồ sơ người dùng:

* id
* name
* phone
* avatar_url
* created_at
* updated_at

Bảng này liên kết với `auth.users` của Supabase.

## 6.2. Bảng user_roles

Lưu vai trò người dùng:

* user
* admin

Dự án có hàm kiểm tra quyền:

```sql
public.has_role(_user_id, _role)
```

Admin dashboard dùng role này để kiểm tra quyền truy cập.

## 6.3. Bảng tours

Lưu dữ liệu tour:

* tiêu đề
* mô tả
* giá
* điểm đến
* loại tour
* số sao
* lịch trình
* dịch vụ bao gồm
* dịch vụ không bao gồm
* gallery
* video_url

## 6.4. Bảng hotels

Lưu dữ liệu khách sạn:

* tên khách sạn
* thành phố
* mô tả
* ảnh đại diện
* gallery
* số sao
* rating
* giá
* thời gian check-in/check-out
* yêu cầu
* owner_id
* owner_email
* owner_name

## 6.5. Bảng hotel_rooms

Lưu thông tin phòng khách sạn:

* hotel_id
* tên phòng
* số giường
* trạng thái còn phòng
* giá cơ bản
* số người cơ bản
* số người tối đa
* mô tả
* ảnh
* loại phòng VIP
* owner_email

## 6.6. Bảng flights

Lưu dữ liệu chuyến bay:

* hãng bay
* mã sân bay đi
* mã sân bay đến
* giờ đi
* giờ đến
* thời lượng
* giá
* hành lý

## 6.7. Bảng bookings

Lưu booking của khách hàng:

* loại booking
* ref_id
* ref_title
* tổng tiền
* trạng thái
* phương thức thanh toán
* thông tin khách hàng
* user_id
* room_id
* trạng thái gửi email
* thời điểm gửi email

Các trạng thái thường dùng:

```txt
pending
paid
cancelled
refunded
```

## 6.8. Bảng vouchers

Lưu mã giảm giá:

* mã voucher
* kiểu giảm giá
* giá trị giảm
* số lượt đã dùng
* trạng thái
* thời gian bắt đầu
* điều kiện áp dụng

## 6.9. Bảng reviews

Lưu đánh giá sau booking:

* user_id
* booking_id
* type
* ref_id
* rating
* comment

Rating giới hạn từ 1 đến 5.

## 6.10. Bảng favorites

Lưu danh sách yêu thích:

* user_id
* type
* ref_id
* ref_title
* ref_image
* ref_price

Mỗi người dùng chỉ được lưu một bản ghi yêu thích cho cùng một dịch vụ.

---

# 7. Thanh toán SePay và QR ngân hàng

Dự án đã có cấu hình cho thanh toán qua SePay và QR ngân hàng.

Các file liên quan:

```txt
src/components/site/BookingFlow.tsx
src/lib/booking.functions.ts
src/lib/booking.server.ts
src/routes/api/sepay/webhook.ts
src/routes/api/public/payment-callback.ts
.env.example
```

## 7.1. Luồng thanh toán đề xuất

1. Người dùng chọn tour, khách sạn, vé máy bay hoặc thuê xe.
2. Người dùng nhập thông tin khách hàng.
3. Hệ thống tạo booking ở trạng thái `pending`.
4. Hệ thống hiển thị QR chuyển khoản.
5. Khách hàng chuyển khoản theo đúng nội dung.
6. SePay gửi webhook về website.
7. API kiểm tra secret/chữ ký webhook.
8. Nếu hợp lệ, hệ thống cập nhật booking thành `paid`.
9. Nếu có voucher, hệ thống tăng số lượt sử dụng voucher.
10. Hệ thống gửi email xác nhận nếu email đã cấu hình đầy đủ.

## 7.2. Biến môi trường thanh toán

```env
PAYMENT_CALLBACK_SECRET=
SEPAY_WEBHOOK_SECRET=
SEPAY_BANK_NAME=TPBank
SEPAY_BANK_ACCOUNT=0865665046
SEPAY_BANK_OWNER=WANDERVIET TRAVEL
PUBLIC_SITE_URL=https://tranvantuanwanderviet.shop
```

## 7.3. Lưu ý khi go-live

Trước khi chạy thật cần kiểm tra:

* Tài khoản ngân hàng nhận tiền đã đúng.
* Tên chủ tài khoản đã đúng.
* Số tài khoản đã đúng.
* Webhook SePay trỏ đúng domain production.
* Secret trong SePay dashboard trùng với biến môi trường.
* API webhook không để lộ service role key.
* Booking chỉ được chuyển sang `paid` khi webhook hợp lệ.

---

# 8. AI Chat và widget liên hệ

## 8.1. Widget liên hệ nổi

Dự án có component:

```txt
src/components/FloatingContactBubble.tsx
```

Widget này hiển thị ở góc phải dưới website và có các lựa chọn:

```txt
Zalo
Messenger
Gọi điện
AI Chat
```

Cấu hình hiện tại:

```txt
Zalo: https://zalo.me/0865665046
Messenger/Facebook: https://www.facebook.com/share/1NFigWzoju/
Gọi điện: tel:0865665046
AI Chat: /ai-chat
```

Chức năng:

* Click Zalo mở tab mới.
* Click Messenger/Facebook mở tab mới.
* Click Gọi điện mở trình gọi điện.
* Click AI Chat chuyển đến trang tư vấn AI.
* Click ngoài widget tự đóng.
* Nhấn ESC để đóng.
* Có hiệu ứng mở/đóng mượt.
* Màu sắc theo concept xanh lá, xanh dương, vàng nắng phù hợp thương hiệu du lịch.

## 8.2. AI Chat

Trang AI Chat nằm tại:

```txt
src/routes/ai-chat.tsx
```

Route:

```txt
/ai-chat
```

AI Chat hiện tại là dạng mock/local chatbot, chưa gọi API AI thật. Nội dung trả lời dựa theo từ khóa.

Các nhóm chủ đề có thể tư vấn:

* Chào hỏi.
* Tour du lịch.
* Lịch trình.
* Giá tour.
* Thanh toán.
* SePay.
* Khách sạn.
* Thuê xe.
* Vé máy bay.
* Liên hệ.
* Số điện thoại tư vấn.

Tin nhắn chào đầu tiên:

```txt
Xin chào 👋 Tôi là trợ lý AI của WanderViet. Bạn muốn tư vấn tour, lịch trình, chi phí hay đặt dịch vụ du lịch?
```

## 8.3. Hướng nâng cấp AI Chat thật

Khi cần kết nối AI thật, có thể thay hàm mock trong:

```txt
src/routes/ai-chat.tsx
```

Bằng API server riêng, ví dụ:

```txt
/api/ai-chat
```

Khuyến nghị khi nâng cấp:

* Frontend không gọi trực tiếp API key AI.
* API key chỉ đặt ở server.
* Thêm rate limit theo IP.
* Lưu lead khách hàng nếu phát hiện số điện thoại.
* Giới hạn chủ đề tư vấn trong phạm vi du lịch, đặt tour, khách sạn và dịch vụ WanderViet.
* Có fallback khi AI lỗi.

---

# 9. Đa ngôn ngữ, giao diện sáng/tối và hiệu ứng

## 9.1. Đa ngôn ngữ

Dự án có hệ thống i18n tại:

```txt
src/lib/i18n.tsx
```

Các ngôn ngữ hỗ trợ:

```txt
vi - Tiếng Việt
en - English
ja - 日本語
zh - 中文
```

Dữ liệu ngôn ngữ được lưu trong localStorage với key:

```txt
wanderviet-language
```

Các thành phần giao diện có thể dùng hook:

```ts
const { t } = useLanguage();
```

## 9.2. Giao diện sáng/tối

Dự án có theme provider tại:

```txt
src/lib/theme.tsx
```

Website hỗ trợ:

```txt
Sáng
Tối
Theo hệ thống
```

Theme giúp website phù hợp nhiều môi trường sử dụng và tăng trải nghiệm người dùng.

## 9.3. Hiệu ứng chuyển trang

Dự án có component:

```txt
src/components/PageTransition.tsx
```

Dùng Framer Motion để tạo hiệu ứng:

* Fade in.
* Slide up nhẹ.
* Blur nhẹ khi vào/ra trang.
* Thời lượng khoảng 0.4s.
* Tạo cảm giác sống động nhưng không quá nặng.

Root route có dùng:

```txt
AnimatePresence
motion
```

để hỗ trợ chuyển trang mượt trong toàn website.

---

# 10. Các lệnh thường dùng

## 10.1. Chạy development

```bash
npm run dev
```

## 10.2. Build production

```bash
npm run build
```

## 10.3. Build chế độ development

```bash
npm run build:dev
```

## 10.4. Preview bản build

```bash
npm run preview
```

## 10.5. Kiểm tra lint

```bash
npm run lint
```

## 10.6. Format code

```bash
npm run format
```

---

# 11. Cấu trúc thư mục

Cấu trúc chính của dự án sau khi bỏ thư mục `.lovable`:

```txt
.
├── .env
├── .env.example
├── .gitignore
├── .prettierignore
├── .prettierrc
├── bun.lock
├── bunfig.toml
├── components.json
├── eslint.config.js
├── package.json
├── tsconfig.json
├── vite.config.ts
├── wrangler.jsonc
├── src/
│   ├── assets/
│   │   ├── dest-dalat.jpg
│   │   ├── dest-danang.jpg
│   │   ├── dest-hanoi.jpg
│   │   ├── dest-hcm.jpg
│   │   ├── dest-nhatrang.jpg
│   │   ├── dest-phuquoc.jpg
│   │   └── hero.jpg
│   ├── components/
│   │   ├── FloatingContactBubble.tsx
│   │   ├── PageTransition.tsx
│   │   ├── admin/
│   │   ├── site/
│   │   └── ui/
│   ├── integrations/
│   │   └── supabase/
│   ├── lib/
│   │   ├── admin-auth.functions.ts
│   │   ├── admin.functions.ts
│   │   ├── adminStore.ts
│   │   ├── auth.tsx
│   │   ├── booking.functions.ts
│   │   ├── booking.server.ts
│   │   ├── i18n.tsx
│   │   ├── mockData.ts
│   │   ├── theme.tsx
│   │   └── utils.ts
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   ├── tours.index.tsx
│   │   ├── tours.$tourId.tsx
│   │   ├── hotels.index.tsx
│   │   ├── hotels.$hotelId.tsx
│   │   ├── flights.tsx
│   │   ├── rentals.tsx
│   │   ├── ai-chat.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── profile.tsx
│   │   ├── reset-password.tsx
│   │   ├── admin.tsx
│   │   ├── admin.index.tsx
│   │   ├── admin.bookings.tsx
│   │   ├── admin.tours.tsx
│   │   ├── admin.hotels.tsx
│   │   ├── admin.flights.tsx
│   │   ├── admin.rentals.tsx
│   │   ├── admin.promos.tsx
│   │   ├── admin.users.tsx
│   │   └── api/
│   ├── router.tsx
│   ├── routeTree.gen.ts
│   ├── server.ts
│   └── styles.css
└── supabase/
    ├── config.toml
    └── migrations/
```

---

# 12. Tài khoản và quyền quản trị

Dự án không thấy seed tài khoản demo cố định kiểu `admin@example.com` trong file ZIP hiện tại.

Cơ chế admin hiện tại:

1. Người dùng đăng ký tài khoản.
2. Người dùng đăng nhập.
3. Hệ thống kiểm tra role trong bảng `user_roles`.
4. Admin có thể được cấp quyền qua server function `claimAdminAccess`.
5. Mật khẩu mở quyền admin lấy từ biến môi trường:

```env
ADMIN_ACCESS_PASSWORD=
```

Nếu biến này chưa được cấu hình, code fallback về:

```txt
123456789
```

Khuyến nghị:

* Không dùng mật khẩu mặc định trong production.
* Tạo admin thủ công trong Supabase trước khi go-live.
* Đặt `ADMIN_ACCESS_PASSWORD` bằng chuỗi mạnh.
* Giới hạn quyền thao tác của service role trong server code.
* Không để service role key xuất hiện trong frontend.

---

# 13. Triển khai production

Khuyến nghị triển khai trên nền tảng hỗ trợ Vite/TanStack Start và Cloudflare/Vercel tương đương.

Checklist production:

1. Bỏ thư mục `.lovable` nếu không còn tiếp tục chỉnh bằng Lovable.
2. Kiểm tra `npm run build` không lỗi.
3. Cấu hình domain thật:

```txt
https://tranvantuanwanderviet.shop
```

4. Cấu hình Supabase:

```env
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

5. Cấu hình thanh toán:

```env
PAYMENT_CALLBACK_SECRET=
SEPAY_WEBHOOK_SECRET=
SEPAY_BANK_NAME=
SEPAY_BANK_ACCOUNT=
SEPAY_BANK_OWNER=
PUBLIC_SITE_URL=
```

6. Đổi mật khẩu admin:

```env
ADMIN_ACCESS_PASSWORD=
```

7. Kiểm tra webhook SePay hoạt động.
8. Kiểm tra đặt tour, khách sạn, vé máy bay và thuê xe.
9. Kiểm tra gửi email booking nếu dùng email thật.
10. Kiểm tra responsive mobile.
11. Kiểm tra widget liên hệ nổi.
12. Kiểm tra AI Chat không bị trắng trang.
13. Kiểm tra RLS trong Supabase.
14. Không commit `.env`.
15. Không public service role key.
16. Bật HTTPS.
17. Bật bảo vệ domain qua Cloudflare nếu có thể.

---

# 14. Ghi chú bảo trì

## 14.1. Về thư mục `.lovable`

Thư mục `.lovable` ban đầu gồm:

```txt
.lovable/plan.md
.lovable/project.json
```

Thư mục này chủ yếu phục vụ Lovable lưu thông tin kế hoạch và template dự án. Khi đã tách dự án ra để tự code/deploy, có thể bỏ `.lovable`.

Sau khi bỏ `.lovable`:

* Website vẫn có thể build/chạy nếu code và dependencies đầy đủ.
* Không ảnh hưởng trực tiếp đến runtime website.
* Có thể làm Lovable mất một phần ngữ cảnh nếu sau này import lại vào Lovable.
* Nếu vẫn muốn tiếp tục sửa bằng Lovable thì nên giữ bản backup.

## 14.2. Về dữ liệu

* Dữ liệu tour, khách sạn, chuyến bay nên được quản lý trong Supabase.
* File `src/lib/mockData.ts` hiện chủ yếu giữ type, dữ liệu địa lý tham chiếu và helper.
* Dữ liệu production không nên hard-code trong frontend.
* Khi thêm bảng mới cần bổ sung RLS policy.

## 14.3. Về bảo mật

* Không đưa service role key vào client.
* Không commit `.env`.
* Đổi mật khẩu admin mặc định.
* Kiểm tra webhook SePay bằng secret.
* Kiểm tra RLS cho bảng bookings, user_roles, profiles, reviews, favorites.
* Giới hạn quyền insert/update/delete với người dùng thường.
* Dùng server function cho thao tác nhạy cảm.

## 14.4. Về hiệu năng

* Tối ưu ảnh trong `src/assets`.
* Nén ảnh trước khi deploy.
* Hạn chế bundle quá nặng.
* Kiểm tra Lighthouse sau khi deploy.
* Với dữ liệu public đọc nhiều, có thể bổ sung cache ở tầng server/CDN.
* Dùng Cloudflare cache cho ảnh tĩnh và tài nguyên public.

## 14.5. Về nâng cấp tương lai

Có thể phát triển thêm:

* AI Chat gọi backend thật.
* Lưu lịch sử chat và lead khách hàng.
* Tích hợp OpenAI/Gemini/Groq.
* Quản lý bài viết/blog du lịch.
* Quản lý banner trang chủ.
* Quản lý SEO từng tour/khách sạn.
* Tích hợp Cloudinary/S3 để upload ảnh.
* Tích hợp gửi email chuyên nghiệp.
* Tích hợp mã giảm giá nâng cao.
* Tích hợp hoàn tiền/hủy đơn.
* Báo cáo doanh thu thật từ database.
* Phân quyền nhiều cấp: admin, staff, hotel_owner, user.
* App mobile hoặc PWA.

---

# WanderViet - Website đặt tour, khách sạn, vé máy bay và dịch vụ du lịch

WanderViet là website du lịch hỗ trợ khách hàng tìm kiếm, đặt tour, đặt khách sạn, đặt vé máy bay, thuê xe và quản lý các dịch vụ du lịch trực tuyến. Dự án được xây dựng bằng React 19, TanStack Router, TanStack Start, TypeScript, Tailwind CSS 4, Supabase và các thành phần giao diện hiện đại. Website có giao diện tiếng Việt, hỗ trợ đa ngôn ngữ, chế độ sáng/tối, luồng đặt dịch vụ, quản trị dữ liệu, thanh toán QR/SePay, AI chat tư vấn và widget liên hệ nổi gồm Zalo, Messenger, gọi điện.

## Demo trực tuyến

Website dự kiến triển khai tại domain:

```txt
https://tranvantuanwanderviet.shop
```

Trang người dùng:

```txt
https://tranvantuanwanderviet.shop
```

Trang quản trị:

```txt
https://tranvantuanwanderviet.shop/admin
```

## Mục lục

1. [Tính năng chính](#1-tính-năng-chính)
2. [Công nghệ sử dụng](#2-công-nghệ-sử-dụng)
3. [Yêu cầu hệ thống](#3-yêu-cầu-hệ-thống)
4. [Cài đặt nhanh](#4-cài-đặt-nhanh)
5. [Biến môi trường](#5-biến-môi-trường)
6. [Cơ sở dữ liệu](#6-cơ-sở-dữ-liệu)
7. [Thanh toán SePay và QR ngân hàng](#7-thanh-toán-sepay-và-qr-ngân-hàng)
8. [AI Chat và widget liên hệ](#8-ai-chat-và-widget-liên-hệ)
9. [Đa ngôn ngữ, giao diện sáng/tối và hiệu ứng](#9-đa-ngôn-ngữ-giao-diện-sángtối-và-hiệu-ứng)
10. [Các lệnh thường dùng](#10-các-lệnh-thường-dùng)
11. [Cấu trúc thư mục](#11-cấu-trúc-thư-mục)
12. [Tài khoản và quyền quản trị](#12-tài-khoản-và-quyền-quản-trị)
13. [Triển khai production](#13-triển-khai-production)
14. [Ghi chú bảo trì](#14-ghi-chú-bảo-trì)

---

# 1. Tính năng chính

## 1.1. Website khách hàng

Website khách hàng của WanderViet cung cấp các trang chính phục vụ nhu cầu du lịch:

* Trang chủ giới thiệu thương hiệu WanderViet, điểm đến nổi bật, tour nổi bật, khách sạn, dịch vụ thuê xe và các tiện ích du lịch.
* Trang danh sách tour du lịch với hình ảnh, mô tả, giá, điểm đến và thông tin chi tiết.
* Trang chi tiết tour hiển thị lịch trình, giá, ảnh đại diện, gallery, video, dịch vụ bao gồm và không bao gồm.
* Trang khách sạn hiển thị danh sách khách sạn, thông tin phòng, giá theo đêm, số sao, điều kiện nhận phòng và trả phòng.
* Trang chi tiết khách sạn cho phép xem thông tin phòng, tiện nghi, gallery, mô tả và đặt phòng.
* Trang vé máy bay hiển thị chuyến bay, hãng bay, điểm đi, điểm đến, giờ khởi hành, giờ đến, thời lượng, hành lý và giá vé.
* Trang thuê xe hỗ trợ hiển thị dịch vụ thuê xe, loại xe, giá thuê và thông tin liên hệ.
* Trang đăng chỗ nghỉ dành cho chủ khách sạn hoặc đối tác muốn đăng dịch vụ lên hệ thống.
* Trang hồ sơ người dùng để xem thông tin tài khoản, booking và dữ liệu cá nhân.
* Form đăng nhập, đăng ký, quên mật khẩu và đặt lại mật khẩu.
* Widget liên hệ nổi gồm Zalo, Messenger/Facebook, gọi điện và AI Chat.

## 1.2. Đặt dịch vụ

Hệ thống có luồng đặt dịch vụ cho nhiều loại sản phẩm du lịch:

* Đặt tour du lịch.
* Đặt khách sạn/phòng.
* Đặt vé máy bay.
* Đặt dịch vụ thuê xe.
* Nhập thông tin khách hàng.
* Nhập danh sách khách đi cùng.
* Nhập căn cước công dân, số điện thoại, email và thông tin liên hệ.
* Chọn phương thức thanh toán.
* Tạo booking ở trạng thái chờ thanh toán.
* Theo dõi trạng thái booking.
* Xác nhận thanh toán thông qua webhook SePay hoặc cơ chế xác nhận dự phòng.
* Lưu thông tin booking vào Supabase.

Các loại booking trong hệ thống gồm:

```txt
tour
hotel
flight
rental
```

## 1.3. Thanh toán

Dự án có hỗ trợ thanh toán theo hướng:

* Thanh toán QR ngân hàng.
* Thanh toán qua SePay webhook.
* Mã nội dung chuyển khoản gắn với booking.
* API webhook nhận tín hiệu thanh toán.
* Kiểm tra chữ ký webhook bằng secret.
* Cập nhật trạng thái booking sau khi thanh toán.
* Tăng lượt sử dụng voucher nếu booking có áp dụng mã giảm giá.
* Gửi email thông báo booking cho khách hàng hoặc chủ dịch vụ nếu có cấu hình email.

Các route/API liên quan:

```txt
src/routes/api/sepay/webhook.ts
src/routes/api/public/payment-callback.ts
src/lib/booking.functions.ts
src/lib/booking.server.ts
```

## 1.4. Admin dashboard

Khu vực quản trị hỗ trợ quản lý các dữ liệu chính của hệ thống:

* Dashboard tổng quan doanh thu, đơn hàng, khách hàng và tỷ lệ chuyển đổi.
* Biểu đồ doanh thu theo tháng bằng Recharts.
* Quản lý booking.
* Lọc booking theo trạng thái, loại dịch vụ và từ khóa.
* Cập nhật trạng thái booking: pending, paid, cancelled, refunded.
* Gửi lại email booking.
* Quản lý tour du lịch.
* Quản lý khách sạn.
* Quản lý vé máy bay.
* Quản lý thuê xe.
* Quản lý voucher/khuyến mãi.
* Quản lý người dùng.
* Kiểm tra quyền admin thông qua Supabase role.
* Một số thao tác admin chạy qua TanStack Server Functions.

Các trang admin chính:

```txt
src/routes/admin.tsx
src/routes/admin.index.tsx
src/routes/admin.bookings.tsx
src/routes/admin.tours.tsx
src/routes/admin.hotels.tsx
src/routes/admin.flights.tsx
src/routes/admin.rentals.tsx
src/routes/admin.promos.tsx
src/routes/admin.users.tsx
```

## 1.5. Tài khoản người dùng

Dự án sử dụng Supabase Auth để xử lý đăng ký, đăng nhập và phiên làm việc.

Chức năng tài khoản gồm:

* Đăng ký tài khoản bằng email, mật khẩu, tên và số điện thoại.
* Đăng nhập bằng email và mật khẩu.
* Đăng xuất.
* Quên mật khẩu.
* Đặt lại mật khẩu.
* Lưu hồ sơ người dùng trong bảng profiles.
* Gán vai trò user/admin trong bảng user_roles.
* Phân quyền admin qua role admin.
* Quản lý yêu thích với bảng favorites.
* Quản lý đánh giá với bảng reviews.

## 1.6. Đánh giá và yêu thích

Hệ thống có các bảng hỗ trợ trải nghiệm người dùng:

* favorites: lưu tour/khách sạn yêu thích của từng người dùng.
* reviews: lưu đánh giá theo booking.
* Mỗi đánh giá có rating từ 1 đến 5 sao.
* Người dùng chỉ được thao tác dữ liệu của chính mình.
* Admin có thể xem dữ liệu tổng quan tùy theo chính sách RLS.

## 1.7. Email

Dự án có hạ tầng email nội bộ trong Supabase:

* Queue email xác thực.
* Queue email giao dịch.
* Bảng log email.
* Bảng trạng thái gửi email.
* Bảng email bị chặn/suppression.
* Token hủy đăng ký nhận email.
* Các route hỗ trợ gửi, preview, process email.

Các route liên quan:

```txt
src/routes/lovable/email/queue/process.ts
src/routes/lovable/email/suppression.ts
src/routes/lovable/email/transactional/preview.ts
src/routes/lovable/email/transactional/send.ts
src/routes/email/unsubscribe.ts
src/routes/unsubscribe.tsx
```

---

# 2. Công nghệ sử dụng

Dự án WanderViet sử dụng các công nghệ chính sau:

```txt
React 19
TypeScript
Vite
TanStack Router
TanStack Start
TanStack React Query
Tailwind CSS 4
Supabase
Supabase Auth
Supabase Database
Supabase Row Level Security
Framer Motion
Lucide React
Radix UI
shadcn/ui style components
React Hook Form
Zod
Sonner
Recharts
date-fns
Cloudflare Vite Plugin
Lovable Vite TanStack Config
```

Các thư viện giao diện và UI:

```txt
@radix-ui/react-dialog
@radix-ui/react-dropdown-menu
@radix-ui/react-select
@radix-ui/react-tabs
@radix-ui/react-tooltip
@radix-ui/react-navigation-menu
lucide-react
class-variance-authority
clsx
tailwind-merge
tw-animate-css
vaul
embla-carousel-react
```

Các thư viện dữ liệu và form:

```txt
@tanstack/react-query
@tanstack/react-router
@tanstack/react-start
react-hook-form
@hookform/resolvers
zod
```

Các thư viện email:

```txt
@lovable.dev/email-js
@lovable.dev/webhooks-js
@react-email/components
react-email
```

---

# 3. Yêu cầu hệ thống

Để chạy dự án ở local, cần chuẩn bị:

```txt
Node.js 20 LTS hoặc mới hơn
npm hoặc bun
Tài khoản Supabase
Supabase project URL
Supabase publishable key
Supabase service role key cho server/admin
```

Khuyến nghị cho production:

```txt
Domain thật, ví dụ https://tranvantuanwanderviet.shop
Supabase production project
SePay webhook secret
Cloudflare hoặc nền tảng deploy hỗ trợ Vite/TanStack Start
HTTPS bắt buộc cho thanh toán và auth
```

---

# 4. Cài đặt nhanh

Cài dependencies:

```bash
npm install
```

Chạy development server:

```bash
npm run dev
```

Build production:

```bash
npm run build
```

Chạy preview bản build:

```bash
npm run preview
```

Kiểm tra lint:

```bash
npm run lint
```

Format code:

```bash
npm run format
```

Nếu dùng Bun:

```bash
bun install
bun run dev
```

Sau khi chạy local, mở website tại địa chỉ Vite hiển thị trong terminal, thường là:

```txt
http://localhost:5173
```

---

# 5. Biến môi trường

File mẫu hiện có:

```txt
.env.example
```

Trong file hiện tại có các biến cho SePay và site:

```env
PAYMENT_CALLBACK_SECRET=
SEPAY_WEBHOOK_SECRET=

SEPAY_BANK_NAME=TPBank
SEPAY_BANK_ACCOUNT=0865665046
SEPAY_BANK_OWNER=WANDERVIET TRAVEL

PUBLIC_SITE_URL=https://tranvantuanwanderviet.shop
```

Ngoài ra, vì dự án dùng Supabase, cần bổ sung các biến sau khi chạy ngoài Lovable Cloud:

```env
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Biến dành cho mở khóa quyền admin:

```env
ADMIN_ACCESS_PASSWORD=your-strong-admin-password
```

Nếu không cấu hình `ADMIN_ACCESS_PASSWORD`, code hiện tại có fallback mặc định là:

```txt
123456789
```

Khi deploy production, bắt buộc nên đổi mật khẩu admin mặc định bằng biến môi trường riêng.

Ví dụ file `.env` production:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

PUBLIC_SITE_URL=https://tranvantuanwanderviet.shop

PAYMENT_CALLBACK_SECRET=your-long-random-secret
SEPAY_WEBHOOK_SECRET=your-long-random-secret

SEPAY_BANK_NAME=TPBank
SEPAY_BANK_ACCOUNT=0865665046
SEPAY_BANK_OWNER=WANDERVIET TRAVEL

ADMIN_ACCESS_PASSWORD=change-this-before-production
```

Lưu ý:

* Không commit file `.env` lên GitHub.
* `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng phía server, tuyệt đối không đưa ra client.
* `VITE_SUPABASE_PUBLISHABLE_KEY` có thể dùng phía client.
* `PAYMENT_CALLBACK_SECRET` và `SEPAY_WEBHOOK_SECRET` nên đặt cùng một giá trị nếu webhook dùng chung secret.
* `PUBLIC_SITE_URL` nên trỏ đúng domain thật để SEO, metadata và callback hoạt động đúng.

---

# 6. Cơ sở dữ liệu

Dự án dùng Supabase PostgreSQL. Các migration nằm tại:

```txt
supabase/migrations/
```

Các bảng chính trong hệ thống:

```txt
profiles
user_roles
tours
hotels
hotel_rooms
flights
bookings
vouchers
reviews
favorites
content_posts
email_logs
email_send_log
email_send_state
suppressed_emails
email_unsubscribe_tokens
```

## 6.1. Bảng profiles

Lưu thông tin hồ sơ người dùng:

* id
* name
* phone
* avatar_url
* created_at
* updated_at

Bảng này liên kết với `auth.users` của Supabase.

## 6.2. Bảng user_roles

Lưu vai trò người dùng:

* user
* admin

Dự án có hàm kiểm tra quyền:

```sql
public.has_role(_user_id, _role)
```

Admin dashboard dùng role này để kiểm tra quyền truy cập.

## 6.3. Bảng tours

Lưu dữ liệu tour:

* tiêu đề
* mô tả
* giá
* điểm đến
* loại tour
* số sao
* lịch trình
* dịch vụ bao gồm
* dịch vụ không bao gồm
* gallery
* video_url

## 6.4. Bảng hotels

Lưu dữ liệu khách sạn:

* tên khách sạn
* thành phố
* mô tả
* ảnh đại diện
* gallery
* số sao
* rating
* giá
* thời gian check-in/check-out
* yêu cầu
* owner_id
* owner_email
* owner_name

## 6.5. Bảng hotel_rooms

Lưu thông tin phòng khách sạn:

* hotel_id
* tên phòng
* số giường
* trạng thái còn phòng
* giá cơ bản
* số người cơ bản
* số người tối đa
* mô tả
* ảnh
* loại phòng VIP
* owner_email

## 6.6. Bảng flights

Lưu dữ liệu chuyến bay:

* hãng bay
* mã sân bay đi
* mã sân bay đến
* giờ đi
* giờ đến
* thời lượng
* giá
* hành lý

## 6.7. Bảng bookings

Lưu booking của khách hàng:

* loại booking
* ref_id
* ref_title
* tổng tiền
* trạng thái
* phương thức thanh toán
* thông tin khách hàng
* user_id
* room_id
* trạng thái gửi email
* thời điểm gửi email

Các trạng thái thường dùng:

```txt
pending
paid
cancelled
refunded
```

## 6.8. Bảng vouchers

Lưu mã giảm giá:

* mã voucher
* kiểu giảm giá
* giá trị giảm
* số lượt đã dùng
* trạng thái
* thời gian bắt đầu
* điều kiện áp dụng

## 6.9. Bảng reviews

Lưu đánh giá sau booking:

* user_id
* booking_id
* type
* ref_id
* rating
* comment

Rating giới hạn từ 1 đến 5.

## 6.10. Bảng favorites

Lưu danh sách yêu thích:

* user_id
* type
* ref_id
* ref_title
* ref_image
* ref_price

Mỗi người dùng chỉ được lưu một bản ghi yêu thích cho cùng một dịch vụ.

---

# 7. Thanh toán SePay và QR ngân hàng

Dự án đã có cấu hình cho thanh toán qua SePay và QR ngân hàng.

Các file liên quan:

```txt
src/components/site/BookingFlow.tsx
src/lib/booking.functions.ts
src/lib/booking.server.ts
src/routes/api/sepay/webhook.ts
src/routes/api/public/payment-callback.ts
.env.example
```

## 7.1. Luồng thanh toán đề xuất

1. Người dùng chọn tour, khách sạn, vé máy bay hoặc thuê xe.
2. Người dùng nhập thông tin khách hàng.
3. Hệ thống tạo booking ở trạng thái `pending`.
4. Hệ thống hiển thị QR chuyển khoản.
5. Khách hàng chuyển khoản theo đúng nội dung.
6. SePay gửi webhook về website.
7. API kiểm tra secret/chữ ký webhook.
8. Nếu hợp lệ, hệ thống cập nhật booking thành `paid`.
9. Nếu có voucher, hệ thống tăng số lượt sử dụng voucher.
10. Hệ thống gửi email xác nhận nếu email đã cấu hình đầy đủ.

## 7.2. Biến môi trường thanh toán

```env
PAYMENT_CALLBACK_SECRET=
SEPAY_WEBHOOK_SECRET=
SEPAY_BANK_NAME=TPBank
SEPAY_BANK_ACCOUNT=0865665046
SEPAY_BANK_OWNER=WANDERVIET TRAVEL
PUBLIC_SITE_URL=https://tranvantuanwanderviet.shop
```

## 7.3. Lưu ý khi go-live

Trước khi chạy thật cần kiểm tra:

* Tài khoản ngân hàng nhận tiền đã đúng.
* Tên chủ tài khoản đã đúng.
* Số tài khoản đã đúng.
* Webhook SePay trỏ đúng domain production.
* Secret trong SePay dashboard trùng với biến môi trường.
* API webhook không để lộ service role key.
* Booking chỉ được chuyển sang `paid` khi webhook hợp lệ.

---

# 8. AI Chat và widget liên hệ

## 8.1. Widget liên hệ nổi

Dự án có component:

```txt
src/components/FloatingContactBubble.tsx
```

Widget này hiển thị ở góc phải dưới website và có các lựa chọn:

```txt
Zalo
Messenger
Gọi điện
AI Chat
```

Cấu hình hiện tại:

```txt
Zalo: https://zalo.me/0865665046
Messenger/Facebook: https://www.facebook.com/share/1NFigWzoju/
Gọi điện: tel:0865665046
AI Chat: /ai-chat
```

Chức năng:

* Click Zalo mở tab mới.
* Click Messenger/Facebook mở tab mới.
* Click Gọi điện mở trình gọi điện.
* Click AI Chat chuyển đến trang tư vấn AI.
* Click ngoài widget tự đóng.
* Nhấn ESC để đóng.
* Có hiệu ứng mở/đóng mượt.
* Màu sắc theo concept xanh lá, xanh dương, vàng nắng phù hợp thương hiệu du lịch.

## 8.2. AI Chat

Trang AI Chat nằm tại:

```txt
src/routes/ai-chat.tsx
```

Route:

```txt
/ai-chat
```

AI Chat hiện tại là dạng mock/local chatbot, chưa gọi API AI thật. Nội dung trả lời dựa theo từ khóa.

Các nhóm chủ đề có thể tư vấn:

* Chào hỏi.
* Tour du lịch.
* Lịch trình.
* Giá tour.
* Thanh toán.
* SePay.
* Khách sạn.
* Thuê xe.
* Vé máy bay.
* Liên hệ.
* Số điện thoại tư vấn.

Tin nhắn chào đầu tiên:

```txt
Xin chào 👋 Tôi là trợ lý AI của WanderViet. Bạn muốn tư vấn tour, lịch trình, chi phí hay đặt dịch vụ du lịch?
```

## 8.3. Hướng nâng cấp AI Chat thật

Khi cần kết nối AI thật, có thể thay hàm mock trong:

```txt
src/routes/ai-chat.tsx
```

Bằng API server riêng, ví dụ:

```txt
/api/ai-chat
```

Khuyến nghị khi nâng cấp:

* Frontend không gọi trực tiếp API key AI.
* API key chỉ đặt ở server.
* Thêm rate limit theo IP.
* Lưu lead khách hàng nếu phát hiện số điện thoại.
* Giới hạn chủ đề tư vấn trong phạm vi du lịch, đặt tour, khách sạn và dịch vụ WanderViet.
* Có fallback khi AI lỗi.

---

# 9. Đa ngôn ngữ, giao diện sáng/tối và hiệu ứng

## 9.1. Đa ngôn ngữ

Dự án có hệ thống i18n tại:

```txt
src/lib/i18n.tsx
```

Các ngôn ngữ hỗ trợ:

```txt
vi - Tiếng Việt
en - English
ja - 日本語
zh - 中文
```

Dữ liệu ngôn ngữ được lưu trong localStorage với key:

```txt
wanderviet-language
```

Các thành phần giao diện có thể dùng hook:

```ts
const { t } = useLanguage();
```

## 9.2. Giao diện sáng/tối

Dự án có theme provider tại:

```txt
src/lib/theme.tsx
```

Website hỗ trợ:

```txt
Sáng
Tối
Theo hệ thống
```

Theme giúp website phù hợp nhiều môi trường sử dụng và tăng trải nghiệm người dùng.

## 9.3. Hiệu ứng chuyển trang

Dự án có component:

```txt
src/components/PageTransition.tsx
```

Dùng Framer Motion để tạo hiệu ứng:

* Fade in.
* Slide up nhẹ.
* Blur nhẹ khi vào/ra trang.
* Thời lượng khoảng 0.4s.
* Tạo cảm giác sống động nhưng không quá nặng.

Root route có dùng:

```txt
AnimatePresence
motion
```

để hỗ trợ chuyển trang mượt trong toàn website.

---

# 10. Các lệnh thường dùng

## 10.1. Chạy development

```bash
npm run dev
```

## 10.2. Build production

```bash
npm run build
```

## 10.3. Build chế độ development

```bash
npm run build:dev
```

## 10.4. Preview bản build

```bash
npm run preview
```

## 10.5. Kiểm tra lint

```bash
npm run lint
```

## 10.6. Format code

```bash
npm run format
```

---

# 11. Cấu trúc thư mục

Cấu trúc chính của dự án sau khi bỏ thư mục `.lovable`:

```txt
.
├── .env
├── .env.example
├── .gitignore
├── .prettierignore
├── .prettierrc
├── bun.lock
├── bunfig.toml
├── components.json
├── eslint.config.js
├── package.json
├── tsconfig.json
├── vite.config.ts
├── wrangler.jsonc
├── src/
│   ├── assets/
│   │   ├── dest-dalat.jpg
│   │   ├── dest-danang.jpg
│   │   ├── dest-hanoi.jpg
│   │   ├── dest-hcm.jpg
│   │   ├── dest-nhatrang.jpg
│   │   ├── dest-phuquoc.jpg
│   │   └── hero.jpg
│   ├── components/
│   │   ├── FloatingContactBubble.tsx
│   │   ├── PageTransition.tsx
│   │   ├── admin/
│   │   ├── site/
│   │   └── ui/
│   ├── integrations/
│   │   └── supabase/
│   ├── lib/
│   │   ├── admin-auth.functions.ts
│   │   ├── admin.functions.ts
│   │   ├── adminStore.ts
│   │   ├── auth.tsx
│   │   ├── booking.functions.ts
│   │   ├── booking.server.ts
│   │   ├── i18n.tsx
│   │   ├── mockData.ts
│   │   ├── theme.tsx
│   │   └── utils.ts
│   ├── routes/
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   ├── tours.index.tsx
│   │   ├── tours.$tourId.tsx
│   │   ├── hotels.index.tsx
│   │   ├── hotels.$hotelId.tsx
│   │   ├── flights.tsx
│   │   ├── rentals.tsx
│   │   ├── ai-chat.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── profile.tsx
│   │   ├── reset-password.tsx
│   │   ├── admin.tsx
│   │   ├── admin.index.tsx
│   │   ├── admin.bookings.tsx
│   │   ├── admin.tours.tsx
│   │   ├── admin.hotels.tsx
│   │   ├── admin.flights.tsx
│   │   ├── admin.rentals.tsx
│   │   ├── admin.promos.tsx
│   │   ├── admin.users.tsx
│   │   └── api/
│   ├── router.tsx
│   ├── routeTree.gen.ts
│   ├── server.ts
│   └── styles.css
└── supabase/
    ├── config.toml
    └── migrations/
```

---

# 12. Tài khoản và quyền quản trị

Dự án không thấy seed tài khoản demo cố định kiểu `admin@example.com` trong file ZIP hiện tại.

Cơ chế admin hiện tại:

1. Người dùng đăng ký tài khoản.
2. Người dùng đăng nhập.
3. Hệ thống kiểm tra role trong bảng `user_roles`.
4. Admin có thể được cấp quyền qua server function `claimAdminAccess`.
5. Mật khẩu mở quyền admin lấy từ biến môi trường:

```env
ADMIN_ACCESS_PASSWORD=
```

Nếu biến này chưa được cấu hình, code fallback về:

```txt
123456789
```

Khuyến nghị:

* Không dùng mật khẩu mặc định trong production.
* Tạo admin thủ công trong Supabase trước khi go-live.
* Đặt `ADMIN_ACCESS_PASSWORD` bằng chuỗi mạnh.
* Giới hạn quyền thao tác của service role trong server code.
* Không để service role key xuất hiện trong frontend.

---

# 13. Triển khai production

Khuyến nghị triển khai trên nền tảng hỗ trợ Vite/TanStack Start và Cloudflare/Vercel tương đương.

Checklist production:

1. Bỏ thư mục `.lovable` nếu không còn tiếp tục chỉnh bằng Lovable.
2. Kiểm tra `npm run build` không lỗi.
3. Cấu hình domain thật:

```txt
https://tranvantuanwanderviet.shop
```

4. Cấu hình Supabase:

```env
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

5. Cấu hình thanh toán:

```env
PAYMENT_CALLBACK_SECRET=
SEPAY_WEBHOOK_SECRET=
SEPAY_BANK_NAME=
SEPAY_BANK_ACCOUNT=
SEPAY_BANK_OWNER=
PUBLIC_SITE_URL=
```

6. Đổi mật khẩu admin:

```env
ADMIN_ACCESS_PASSWORD=
```

7. Kiểm tra webhook SePay hoạt động.
8. Kiểm tra đặt tour, khách sạn, vé máy bay và thuê xe.
9. Kiểm tra gửi email booking nếu dùng email thật.
10. Kiểm tra responsive mobile.
11. Kiểm tra widget liên hệ nổi.
12. Kiểm tra AI Chat không bị trắng trang.
13. Kiểm tra RLS trong Supabase.
14. Không commit `.env`.
15. Không public service role key.
16. Bật HTTPS.
17. Bật bảo vệ domain qua Cloudflare nếu có thể.

---

# 14. Ghi chú bảo trì

## 14.1. Về thư mục `.lovable`

Thư mục `.lovable` ban đầu gồm:

```txt
.lovable/plan.md
.lovable/project.json
```

Thư mục này chủ yếu phục vụ Lovable lưu thông tin kế hoạch và template dự án. Khi đã tách dự án ra để tự code/deploy, có thể bỏ `.lovable`.

Sau khi bỏ `.lovable`:

* Website vẫn có thể build/chạy nếu code và dependencies đầy đủ.
* Không ảnh hưởng trực tiếp đến runtime website.
* Có thể làm Lovable mất một phần ngữ cảnh nếu sau này import lại vào Lovable.
* Nếu vẫn muốn tiếp tục sửa bằng Lovable thì nên giữ bản backup.

## 14.2. Về dữ liệu

* Dữ liệu tour, khách sạn, chuyến bay nên được quản lý trong Supabase.
* File `src/lib/mockData.ts` hiện chủ yếu giữ type, dữ liệu địa lý tham chiếu và helper.
* Dữ liệu production không nên hard-code trong frontend.
* Khi thêm bảng mới cần bổ sung RLS policy.

## 14.3. Về bảo mật

* Không đưa service role key vào client.
* Không commit `.env`.
* Đổi mật khẩu admin mặc định.
* Kiểm tra webhook SePay bằng secret.
* Kiểm tra RLS cho bảng bookings, user_roles, profiles, reviews, favorites.
* Giới hạn quyền insert/update/delete với người dùng thường.
* Dùng server function cho thao tác nhạy cảm.

## 14.4. Về hiệu năng

* Tối ưu ảnh trong `src/assets`.
* Nén ảnh trước khi deploy.
* Hạn chế bundle quá nặng.
* Kiểm tra Lighthouse sau khi deploy.
* Với dữ liệu public đọc nhiều, có thể bổ sung cache ở tầng server/CDN.
* Dùng Cloudflare cache cho ảnh tĩnh và tài nguyên public.

## 14.5. Về nâng cấp tương lai

Có thể phát triển thêm:

* AI Chat gọi backend thật.
* Lưu lịch sử chat và lead khách hàng.
* Tích hợp OpenAI/Gemini/Groq.
* Quản lý bài viết/blog du lịch.
* Quản lý banner trang chủ.
* Quản lý SEO từng tour/khách sạn.
* Tích hợp Cloudinary/S3 để upload ảnh.
* Tích hợp gửi email chuyên nghiệp.
* Tích hợp mã giảm giá nâng cao.
* Tích hợp hoàn tiền/hủy đơn.
* Báo cáo doanh thu thật từ database.
* Phân quyền nhiều cấp: admin, staff, hotel_owner, user.
* App mobile hoặc PWA.

---
