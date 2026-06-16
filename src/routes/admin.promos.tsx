import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminDeleteVoucher, adminListVouchers, adminUpsertVoucher } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/promos")({ component: AdminPromos });

type Voucher = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  usage_limit: number | null;
  used: number;
  status: "active" | "inactive" | "expired";
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
};

const schema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Mã tối thiểu 2 ký tự")
    .max(32, "Tối đa 32 ký tự")
    .regex(/^[A-Z0-9_-]+$/, "Chỉ chữ HOA, số, _ hoặc -"),
  discount_type: z.enum(["percent", "fixed"]),
  discount_value: z.number().positive("Phải lớn hơn 0"),
  usage_limit: z.number().int().positive().nullable(),
  starts_at: z.string().nullable(),
  expires_at: z.string().nullable(),
  status: z.enum(["active", "inactive", "expired"]),
});

type VoucherPayload = z.infer<typeof schema>;

function formatDiscount(v: Voucher) {
  if (v.discount_type === "percent") return `-${v.discount_value}%`;
  return `-${v.discount_value.toLocaleString("vi-VN")}đ`;
}

function isExpired(v: Voucher) {
  return v.expires_at ? new Date(v.expires_at).getTime() < Date.now() : false;
}

function AdminPromos() {
  const [list, setList] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Voucher | null>(null);
  const [toDelete, setToDelete] = useState<Voucher | null>(null);

  const loadVouchers = useServerFn(adminListVouchers);
  const saveVoucher = useServerFn(adminUpsertVoucher);
  const removeVoucher = useServerFn(adminDeleteVoucher);

  const reload = async () => {
    setLoading(true);
    try {
      const data = await loadVouchers();
      setList((data ?? []) as Voucher[]);
    } catch (e) {
      toast.error((e as Error).message || "Không tải được danh sách voucher");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const handleSave = async (payload: VoucherPayload, id?: string | null) => {
    await saveVoucher({ data: { id: id ?? null, values: payload } });
    await reload();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading">Quản lý khuyến mãi</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Tạo voucher
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : list.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          Chưa có voucher nào. Bấm "Tạo voucher" để thêm mới.
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {list.map((p) => {
            const expired = isExpired(p) || p.status === "expired";
            const status = expired ? "expired" : p.status;
            const pct = p.usage_limit ? Math.min(100, (p.used / p.usage_limit) * 100) : 0;
            return (
              <Card key={p.id} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <Tag className="h-5 w-5 text-primary" />
                  <Badge
                    variant={status === "active" ? "default" : "secondary"}
                    className={
                      status === "active"
                        ? "bg-emerald-500"
                        : status === "expired"
                          ? "bg-red-500 text-white"
                          : ""
                    }
                  >
                    {status}
                  </Badge>
                </div>
                <p className="font-mono text-lg font-bold">{p.code}</p>
                <p className="text-2xl font-heading font-bold text-primary mt-1">
                  {formatDiscount(p)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {p.discount_type === "percent" ? "Giảm theo %" : "Giảm cố định"}
                </p>
                {(p.starts_at || p.expires_at) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {p.starts_at ? `Từ ${new Date(p.starts_at).toLocaleDateString("vi-VN")}` : "Từ ngay"}
                    {" → "}
                    {p.expires_at ? new Date(p.expires_at).toLocaleDateString("vi-VN") : "Không hạn"}
                  </p>
                )}
                <div className="mt-3 pt-3 border-t text-xs flex justify-between">
                  <span className="text-muted-foreground">Đã dùng</span>
                  <span className="font-semibold">
                    {p.used}/{p.usage_limit ?? "∞"}
                  </span>
                </div>
                {p.usage_limit ? (
                  <div className="h-1.5 bg-secondary rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground mt-1">Không giới hạn</p>
                )}
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setEditing(p);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Sửa
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-600"
                    onClick={() => setToDelete(p)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <VoucherDialog
        open={open}
        onOpenChange={setOpen}
        initial={editing}
        onSave={handleSave}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá voucher?</AlertDialogTitle>
            <AlertDialogDescription>
              Voucher <span className="font-mono font-bold">{toDelete?.code}</span> sẽ bị xoá khỏi Supabase.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!toDelete) return;
                try {
                  await removeVoucher({ data: { id: toDelete.id } });
                  toast.success("Đã xoá voucher");
                  await reload();
                } catch (e) {
                  toast.error((e as Error).message || "Không xoá được voucher");
                } finally {
                  setToDelete(null);
                }
              }}
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function VoucherDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Voucher | null;
  onSave: (payload: VoucherPayload, id?: string | null) => Promise<void>;
}) {
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "expired">("active");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCode(initial?.code ?? "");
      setDiscountType(initial?.discount_type ?? "percent");
      setDiscountValue(initial ? String(initial.discount_value) : "");
      setUsageLimit(initial?.usage_limit ? String(initial.usage_limit) : "");
      setStartsAt(initial?.starts_at ? initial.starts_at.slice(0, 10) : "");
      setExpiresAt(initial?.expires_at ? initial.expires_at.slice(0, 10) : "");
      setStatus(initial?.status ?? "active");
    }
  }, [open, initial]);

  const submit = async () => {
    const parsed = schema.safeParse({
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      usage_limit: usageLimit ? Number(usageLimit) : null,
      starts_at: startsAt || null,
      expires_at: expiresAt || null,
      status,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
      return;
    }
    if (
      parsed.data.discount_type === "percent" &&
      (parsed.data.discount_value < 1 || parsed.data.discount_value > 100)
    ) {
      toast.error("Phần trăm phải từ 1 đến 100");
      return;
    }
    if (
      parsed.data.starts_at &&
      parsed.data.expires_at &&
      new Date(parsed.data.starts_at) > new Date(parsed.data.expires_at)
    ) {
      toast.error("Ngày bắt đầu phải trước ngày kết thúc");
      return;
    }

    setSaving(true);
    try {
      const payload: VoucherPayload = {
        code: parsed.data.code,
        discount_type: parsed.data.discount_type,
        discount_value: parsed.data.discount_value,
        usage_limit: parsed.data.usage_limit,
        starts_at: parsed.data.starts_at ? new Date(parsed.data.starts_at).toISOString() : null,
        expires_at: parsed.data.expires_at ? new Date(parsed.data.expires_at).toISOString() : null,
        status: parsed.data.status,
      };
      await onSave(payload, initial?.id ?? null);
      toast.success(initial ? "Đã cập nhật voucher" : "Đã tạo voucher");
      onOpenChange(false);
    } catch (e) {
      toast.error((e as Error).message || "Không lưu được voucher");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Sửa voucher" : "Tạo voucher mới"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Mã voucher</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SUMMER50" maxLength={32} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-2 block">Loại giảm giá</Label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as "percent" | "fixed")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Phần trăm (%)</SelectItem>
                  <SelectItem value="fixed">Số tiền (VND)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Giá trị {discountType === "percent" ? "(%)" : "(VND)"}</Label>
              <Input type="number" min={1} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder={discountType === "percent" ? "50" : "100000"} />
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Giới hạn sử dụng</Label>
            <Input type="number" min={1} value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} placeholder="Để trống = không giới hạn" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-2 block">Ngày bắt đầu</Label>
              <Input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
            </div>
            <div>
              <Label className="mb-2 block">Ngày kết thúc</Label>
              <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Trạng thái</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive" | "expired")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Tạm dừng</SelectItem>
                <SelectItem value="expired">Hết hạn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Huỷ</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Đang lưu..." : initial ? "Lưu" : "Tạo voucher"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
