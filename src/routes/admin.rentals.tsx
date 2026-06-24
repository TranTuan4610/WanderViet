import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CrudFormDialog, type FieldDef } from "@/components/admin/CrudFormDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  addVehicle,
  deleteVehicle,
  rentalLocations,
  resetRentals,
  updateVehicle,
  useRentalsVersion,
  type Vehicle,
  type VehicleType,
} from "@/lib/rentalData";

export const Route = createFileRoute("/admin/rentals")({ component: AdminRentals });

const fields: FieldDef[] = [
  { key: "type", label: "Loại xe (motorbike/car)", required: true, placeholder: "motorbike hoặc car" },
  { key: "brand", label: "Hãng", required: true, placeholder: "Honda, Toyota..." },
  { key: "name", label: "Tên mẫu", required: true, placeholder: "Vision 2023" },
  { key: "pricePerDay", label: "Giá / ngày (VND)", type: "number", required: true },
  { key: "seats", label: "Số chỗ (chỉ ô tô)", type: "number" },
  { key: "transmission", label: "Hộp số (manual/auto - chỉ ô tô)", placeholder: "manual hoặc auto" },
  { key: "image", label: "Ảnh", type: "image" },
];

const fmt = (n: number) => n.toLocaleString("vi-VN") + "đ";

function AdminRentals() {
  useRentalsVersion();
  const [locationSlug, setLocationSlug] = useState(rentalLocations[0].slug);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);

  const location = rentalLocations.find((l) => l.slug === locationSlug)!;

  const handleSubmit = (v: Record<string, unknown>) => {
    const type = (String(v.type).toLowerCase() === "car" ? "car" : "motorbike") as VehicleType;
    const transmissionRaw = String(v.transmission ?? "").toLowerCase();
    const payload: Omit<Vehicle, "id"> = {
      type,
      brand: String(v.brand),
      name: String(v.name),
      pricePerDay: Number(v.pricePerDay),
      image: String(v.image || ""),
      ...(type === "car"
        ? {
            seats: Number(v.seats || 5),
            transmission: (transmissionRaw === "auto" ? "auto" : "manual") as "manual" | "auto",
          }
        : {}),
    };
    if (editing) {
      updateVehicle(locationSlug, editing.id, payload);
      toast.success("Đã cập nhật xe");
    } else {
      addVehicle(locationSlug, payload);
      toast.success("Đã thêm xe mới");
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-2xl font-bold font-heading">Quản lý thuê xe</h1>
        <div className="flex items-center gap-2">
          <Select value={locationSlug} onValueChange={setLocationSlug}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              {rentalLocations.map((l) => (
                <SelectItem key={l.slug} value={l.slug}>{l.name} ({l.vehicles.length})</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { if (confirm("Khôi phục dữ liệu xe gốc cho tất cả địa điểm?")) { resetRentals(); toast.success("Đã khôi phục"); } }}>
            <RotateCcw className="h-4 w-4 mr-1" />Reset
          </Button>
          <Button onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" />Thêm xe
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Ảnh</TableHead><TableHead>Loại</TableHead><TableHead>Hãng</TableHead>
            <TableHead>Tên</TableHead><TableHead>Chỗ</TableHead><TableHead>Hộp số</TableHead>
            <TableHead>Giá/ngày</TableHead><TableHead className="text-right">Hành động</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {location.vehicles.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  {v.image ? <img src={v.image} alt="" className="h-10 w-16 object-cover rounded" /> : <div className="h-10 w-16 rounded bg-muted" />}
                </TableCell>
                <TableCell>{v.type === "motorbike" ? "Xe máy" : "Ô tô"}</TableCell>
                <TableCell>{v.brand}</TableCell>
                <TableCell className="font-medium">{v.name}</TableCell>
                <TableCell>{v.seats ?? "-"}</TableCell>
                <TableCell>{v.transmission ?? "-"}</TableCell>
                <TableCell className="text-primary font-semibold">{fmt(v.pricePerDay)}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(v); setOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (confirm(`Xóa ${v.brand} ${v.name}?`)) { deleteVehicle(locationSlug, v.id); toast.success("Đã xóa"); }
                  }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground mt-3">{location.name} • {location.vehicles.length} xe</p>
      </Card>

      <CrudFormDialog<Vehicle>
        open={open} onOpenChange={setOpen}
        title={editing ? "Chỉnh sửa xe" : "Thêm xe mới"}
        fields={fields}
        initial={editing ?? undefined}
        onSubmit={handleSubmit}
      />
    </>
  );
}
