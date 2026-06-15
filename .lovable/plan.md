# Kế hoạch

## 1. Gỡ mục "Nội dung" khỏi admin
- `src/components/admin/AdminLayout.tsx`: xoá item `{ to: "/admin/content", label: "Nội dung" }` và bỏ import `Newspaper`.
- Xoá file `src/routes/admin.content.tsx` (TanStack Router sẽ tự cập nhật `routeTree.gen.ts`).

## 2. Thêm chức năng tạo & quản lý voucher đầy đủ tại `/admin/promos`
Bảng `public.vouchers` đã có sẵn với policy `Admins manage vouchers` (chỉ admin được insert/update/delete) và `Public read vouchers` (status='active'). Sẽ viết lại `src/routes/admin.promos.tsx` để:

### Tải dữ liệu thật
- Dùng `supabase.from("vouchers").select("*").order("created_at", { ascending: false })`.
- Hiển thị mỗi voucher dưới dạng card (giống layout hiện tại) nhưng dữ liệu lấy từ DB: `code`, `discount_type` (percent/fixed), `discount_value`, `used`, `usage_limit`, `status`, `expires_at`.

### Nút "Tạo voucher" → Dialog form
Form fields:
- **Mã voucher** (`code`) — text, bắt buộc, tự uppercase, tối đa 32 ký tự, regex `^[A-Z0-9_-]+$`.
- **Loại giảm giá** (`discount_type`) — Select: `percent` (Phần trăm %) | `fixed` (Số tiền VND).
- **Giá trị giảm** (`discount_value`) — number; nếu percent thì 1-100, nếu fixed thì >0.
- **Giới hạn sử dụng** (`usage_limit`) — number, optional (để trống = không giới hạn).
- **Ngày hết hạn** (`expires_at`) — date input, optional, áp dụng `min=today` (Input đã có guard sẵn).
- **Trạng thái** (`status`) — Select: `active` | `inactive` | `expired`. Mặc định `active`.

Validate bằng Zod trước khi insert. Insert qua `supabase.from("vouchers").insert({...})`. Sau khi thành công: toast + reload list + đóng dialog.

### Sửa & xoá
- Mỗi card thêm 2 nút nhỏ: **Sửa** (mở lại dialog ở chế độ edit, prefilled) và **Xoá** (AlertDialog xác nhận → `delete().eq("id", id)`).
- Edit dùng cùng dialog component với prop `initial`.

### UI/UX nhỏ
- Tự hiển thị badge `expired` (đỏ) khi `expires_at < now()` ngay cả khi DB vẫn lưu `active`.
- Hiển thị `discount_value` đúng định dạng: `-50%` hoặc `-1.000.000đ`.
- Progress bar `used/usage_limit` giữ nguyên, ẩn nếu `usage_limit` null (hiển thị "Không giới hạn").
- Empty state khi chưa có voucher.

## Files thay đổi
- `src/components/admin/AdminLayout.tsx` — bỏ menu Nội dung.
- `src/routes/admin.content.tsx` — xoá.
- `src/routes/admin.promos.tsx` — viết lại với CRUD đầy đủ + dialog form.

Không thay đổi schema DB, không tạo migration (bảng `vouchers` + RLS đã sẵn sàng).
