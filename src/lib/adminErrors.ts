type MaybeSupabaseError = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

export function explainSupabaseError(error: unknown, context = "Thao tác Supabase thất bại") {
  const e = (error ?? {}) as MaybeSupabaseError;
  const raw = [e.message, e.details, e.hint].filter(Boolean).join(" | ") || String(error || "Unknown error");
  const msg = raw.toLowerCase();
  const code = e.code ? ` (${e.code})` : "";

  if (msg.includes("missing supabase environment") || msg.includes("supabase environment variable")) {
    return `${context}: thiếu biến môi trường Supabase. Cần cấu hình SUPABASE_URL/VITE_SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY hoặc VITE_SUPABASE_PUBLISHABLE_KEY.${code}`;
  }
  if (msg.includes("could not find the table") || msg.includes("relation") && msg.includes("does not exist")) {
    return `${context}: thiếu table trong database. Hãy chạy đầy đủ migration trong supabase/migrations.${code} Chi tiết: ${raw}`;
  }
  if (msg.includes("column") && msg.includes("does not exist")) {
    return `${context}: thiếu cột trong table. Hãy chạy migration chuẩn hóa schema mới nhất.${code} Chi tiết: ${raw}`;
  }
  if (msg.includes("row-level security") || msg.includes("violates row-level security") || e.code === "42501") {
    return `${context}: lỗi RLS/permission. Admin mutation phải chạy qua server function dùng SUPABASE_SERVICE_ROLE_KEY, hoặc policy chưa đúng.${code} Chi tiết: ${raw}`;
  }
  if (msg.includes("permission denied") || msg.includes("not authorized") || msg.includes("jwt")) {
    return `${context}: lỗi quyền truy cập/permission.${code} Chi tiết: ${raw}`;
  }
  if (msg.includes("duplicate key") || e.code === "23505") {
    return `${context}: dữ liệu bị trùng khóa unique.${code} Chi tiết: ${raw}`;
  }
  if (msg.includes("violates foreign key") || e.code === "23503") {
    return `${context}: dữ liệu liên kết không tồn tại hoặc đã bị xóa.${code} Chi tiết: ${raw}`;
  }

  return `${context}${code}: ${raw}`;
}

export function getErrorMessage(error: unknown, context?: string) {
  if (error instanceof Error) return context ? explainSupabaseError(error, context) : error.message;
  return explainSupabaseError(error, context);
}
