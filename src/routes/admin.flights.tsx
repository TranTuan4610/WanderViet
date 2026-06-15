import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CrudFormDialog, type FieldDef } from "@/components/admin/CrudFormDialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { addFlight, deleteFlight, updateFlight, useAdminVersion } from "@/lib/adminStore";
import { flights, formatVND, type Flight } from "@/lib/mockData";

export const Route = createFileRoute("/admin/flights")({ component: AdminFlights });

const fields: FieldDef[] = [
  { key: "airline", label: "Hãng bay", required: true, placeholder: "VD: Vietnam Airlines" },
  { key: "from", label: "Sân bay đi (mã)", required: true, placeholder: "HAN" },
  { key: "to", label: "Sân bay đến (mã)", required: true, placeholder: "SGN" },
  { key: "depart", label: "Giờ khởi hành", required: true, placeholder: "06:00" },
  { key: "arrive", label: "Giờ đến", required: true, placeholder: "08:15" },
  { key: "duration", label: "Thời gian bay", placeholder: "2h 15m" },
  { key: "price", label: "Giá vé (VND)", type: "number", required: true },
  { key: "baggage", label: "Hành lý", placeholder: "23kg" },
];

function AdminFlights() {
  useAdminVersion();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Flight | null>(null);

  const handleSubmit = (v: Record<string, unknown>) => {
    const payload: Omit<Flight, "id"> = {
      airline: String(v.airline), from: String(v.from).toUpperCase(), to: String(v.to).toUpperCase(),
      depart: String(v.depart), arrive: String(v.arrive),
      duration: String(v.duration || ""), price: Number(v.price), baggage: String(v.baggage || "7kg"),
    };
    if (editing) { updateFlight(editing.id, payload); toast.success("Đã cập nhật chuyến bay"); }
    else { addFlight(payload); toast.success("Đã thêm chuyến bay mới"); }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading">Quản lý vé máy bay</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" />Thêm chuyến bay</Button>
      </div>
      <Card className="p-6">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Hãng</TableHead><TableHead>Hành trình</TableHead><TableHead>Giờ bay</TableHead>
            <TableHead>Thời gian</TableHead><TableHead>Giá</TableHead><TableHead>Hành lý</TableHead>
            <TableHead className="text-right">Hành động</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {flights.slice(0, 40).map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.airline}</TableCell>
                <TableCell><span className="font-mono">{f.from} → {f.to}</span></TableCell>
                <TableCell>{f.depart} - {f.arrive}</TableCell>
                <TableCell>{f.duration}</TableCell>
                <TableCell className="text-primary font-semibold">{formatVND(f.price)}</TableCell>
                <TableCell>{f.baggage}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(f); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => { deleteFlight(f.id); toast.success("Đã xóa"); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="text-xs text-muted-foreground mt-3">Hiển thị 40 chuyến đầu (tổng: {flights.length})</p>
      </Card>

      <CrudFormDialog<Flight>
        open={open} onOpenChange={setOpen}
        title={editing ? "Chỉnh sửa chuyến bay" : "Thêm chuyến bay mới"}
        fields={fields}
        initial={editing ?? undefined}
        onSubmit={handleSubmit}
      />
    </>
  );
}
