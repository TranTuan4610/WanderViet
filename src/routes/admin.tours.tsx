import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CrudFormDialog, type FieldDef } from "@/components/admin/CrudFormDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { addTour, deleteTour, updateTour, useAdminVersion } from "@/lib/adminStore";
import { formatVND, tours, type Tour } from "@/lib/mockData";

export const Route = createFileRoute("/admin/tours")({ component: AdminTours });

const fields: FieldDef[] = [
  { key: "title", label: "Tên tour", required: true, placeholder: "VD: Đà Lạt 3N2Đ" },
  { key: "destination", label: "Vị trí / điểm đến", required: true, placeholder: "VD: Đà Lạt" },
  { key: "image", label: "Ảnh đại diện (URL)", type: "image", required: true },
  { key: "gallery", label: "Thư viện ảnh (hiện trong chi tiết tour)", type: "images",
    hint: "Mỗi dòng = 1 URL, hoặc bấm 'Tải ảnh từ máy' để thêm" },
  { key: "price", label: "Giá (VND)", type: "number", required: true },
  { key: "oldPrice", label: "Giá cũ (VND)", type: "number" },
  { key: "days", label: "Số ngày", type: "number", required: true },
  { key: "nights", label: "Số đêm", type: "number", required: true },
  { key: "rating", label: "Đánh giá (0-5)", type: "number" },
  { key: "stars", label: "Hạng sao", type: "number" },
  { key: "seatsLeft", label: "Số chỗ còn", type: "number" },
  { key: "type", label: "Loại (Biển/Núi/Văn hóa/Thành phố)", placeholder: "Biển" },
  { key: "description", label: "Mô tả", type: "textarea" },
  { key: "videoUrl", label: "Video giới thiệu (YouTube URL hoặc embed URL)", placeholder: "https://www.youtube.com/watch?v=...",
    hint: "Để trống sẽ dùng video gợi ý theo điểm đến" },
  { key: "schedule", label: "Lịch trình", type: "schedule",
    placeholder: "Đón đoàn | Xe đón đoàn, di chuyển tới điểm đến\nKhám phá | Tham quan các điểm nổi bật",
    hint: "Mỗi dòng = 1 ngày, dùng dấu | để tách Tiêu đề và Chi tiết" },
  { key: "included", label: "Dịch vụ bao gồm", type: "list",
    placeholder: "Xe du lịch\nKhách sạn 4 sao\nHDV", hint: "Mỗi dòng = 1 mục" },
  { key: "excluded", label: "Dịch vụ không bao gồm", type: "list",
    placeholder: "Đồ uống\nTip HDV", hint: "Mỗi dòng = 1 mục" },
];

function AdminTours() {
  useAdminVersion();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tour | null>(null);

  const handleSubmit = async (v: Record<string, unknown>) => {
    const payload = {
      title: String(v.title), destination: String(v.destination), image: String(v.image),
      price: Number(v.price), oldPrice: v.oldPrice ? Number(v.oldPrice) : undefined,
      days: Number(v.days) || 1, nights: Number(v.nights) || 0,
      rating: Number(v.rating) || 4.5, reviews: 0, stars: Number(v.stars) || 3,
      type: (String(v.type) || "Biển") as Tour["type"],
      seatsLeft: Number(v.seatsLeft) || 10,
      schedule: (Array.isArray(v.schedule) ? v.schedule : editing?.schedule ?? []) as Tour["schedule"],
      included: (Array.isArray(v.included) ? v.included : editing?.included ?? []) as string[],
      excluded: (Array.isArray(v.excluded) ? v.excluded : editing?.excluded ?? []) as string[],
      description: String(v.description ?? ""),
      gallery: (Array.isArray(v.gallery) ? v.gallery : editing?.gallery ?? []) as string[],
      videoUrl: v.videoUrl ? String(v.videoUrl).trim() : undefined,
    };
    try {
      if (editing) {
        await updateTour(editing.id, payload);
        toast.success("Đã cập nhật tour và đồng bộ Supabase");
      } else {
        await addTour(payload as Omit<Tour, "id">);
        toast.success("Đã thêm tour mới vào Supabase");
      }
    } catch (e) {
      toast.error((e as Error).message || "Không lưu được tour");
      throw e;
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading">Quản lý Tours</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />Thêm tour</Button>
      </div>
      <Card className="p-6">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Tour</TableHead><TableHead>Địa điểm</TableHead><TableHead>Thời gian</TableHead>
            <TableHead>Giá</TableHead><TableHead>Sao</TableHead><TableHead>Chỗ còn</TableHead><TableHead className="text-right">Hành động</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {tours.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium flex items-center gap-3">
                  <img src={t.image} alt="" className="h-10 w-14 rounded object-cover" />
                  <span className="line-clamp-1 max-w-xs">{t.title}</span>
                </TableCell>
                <TableCell>{t.destination}</TableCell>
                <TableCell>{t.days}N{t.nights}Đ</TableCell>
                <TableCell className="text-primary font-semibold">{formatVND(t.price)}</TableCell>
                <TableCell>{"★".repeat(t.stars)}</TableCell>
                <TableCell>{t.seatsLeft}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(t); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={async () => {
                    try {
                      await deleteTour(t.id);
                      toast.success("Đã xóa tour khỏi Supabase");
                    } catch (e) {
                      toast.error((e as Error).message || "Không xóa được tour");
                    }
                  }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <CrudFormDialog<Tour>
        open={open} onOpenChange={setOpen}
        title={editing ? "Chỉnh sửa tour" : "Thêm tour mới"}
        description="Điền thông tin tour. Trường * là bắt buộc."
        fields={fields}
        initial={editing ?? undefined}
        onSubmit={handleSubmit}
      />
    </>
  );
}
