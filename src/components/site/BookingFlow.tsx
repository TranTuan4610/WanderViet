import { Check, Copy, QrCode, Share2, Tag, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatVND } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";

import {
  confirmBookingPayment,
  createPendingBooking,
  getBookingStatus,
} from "@/lib/booking.functions";

type AppliedVoucher = {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  discount_amount: number;
};

const steps = ["Chi tiết", "Thông tin", "Thanh toán", "Hoàn tất"];

const BANK_BIN = "TPB";
const BANK_ACCOUNT = "0865665046";
const BANK_OWNER = "WANDERVIET TRAVEL";
const MOMO_ACCOUNT = "0865665046";

export type BookingFlowProps = {
  title: string;
  subtitle: string;
  total: number;
  orderInfo: string;
  summary: ReactNode;
  step0: ReactNode;
  bookingType: "tour" | "hotel" | "flight" | "rental";
  refId: string;
  refTitle?: string;
  extraInfo?: Record<string, unknown>;
  guestCount?: number;
  validateStep0?: () => string | null;
};

type GuestInfo = { name: string; phone: string; cccd: string; email: string };

const phoneOk = (v: string) => /^\d{8,11}$/.test(v.trim());
const cccdOk = (v: string) => /^\d{12}$/.test(v.trim()) || v.trim().toUpperCase() === "TE";
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const emptyGuest = (): GuestInfo => ({ name: "", phone: "", cccd: "", email: "" });

export function BookingFlow({
  title, subtitle, total, orderInfo, summary, step0,
  bookingType, refId, refTitle, extraInfo,
  guestCount = 1, validateStep0,
}: BookingFlowProps) {
  const navigate = useNavigate();
  const createBooking = useServerFn(createPendingBooking);
  const checkStatus = useServerFn(getBookingStatus);
  const confirmPayment = useServerFn(confirmBookingPayment);

  const [step, setStep] = useState(0);
  const [payment, setPayment] = useState<"qr" | "momo">("qr");
  const [guests, setGuests] = useState<GuestInfo[]>(() => Array.from({ length: Math.max(1, guestCount) }, emptyGuest));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [qrPaid, setQrPaid] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [voucher, setVoucher] = useState<AppliedVoucher | null>(null);

  const discount = voucher?.discount_amount ?? 0;
  const finalTotal = Math.max(0, total - discount);

  // Re-sync guest array when guestCount changes
  useEffect(() => {
    const n = Math.max(1, guestCount);
    setGuests((prev) => {
      if (prev.length === n) return prev;
      if (prev.length < n) return [...prev, ...Array.from({ length: n - prev.length }, emptyGuest)];
      return prev.slice(0, n);
    });
  }, [guestCount]);

  const qrUrl = useMemo(() => {
    if (payment === "qr") {
      const params = new URLSearchParams({
        amount: String(finalTotal),
        addInfo: orderInfo,
        accountName: BANK_OWNER,
      });
      return `https://img.vietqr.io/image/${BANK_BIN}-${BANK_ACCOUNT}-compact2.png?${params.toString()}`;
    }
    const momoData = `2|99|${MOMO_ACCOUNT}|||0|0|${finalTotal}|${orderInfo}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(momoData)}`;
  }, [payment, finalTotal, orderInfo]);

  async function applyVoucher() {
    const code = voucherCode.trim().toUpperCase();
    if (!code) return;
    setApplyingVoucher(true);
    try {
      const { data, error } = await supabase
        .from("vouchers")
        .select("id, code, discount_type, discount_value, usage_limit, used, status, starts_at, expires_at")
        .eq("code", code)
        .maybeSingle();
      if (error) throw error;
      if (!data) { toast.error("Mã voucher không tồn tại"); return; }
      if (data.status !== "active") { toast.error("Voucher không còn hiệu lực"); return; }
      const now = Date.now();
      if (data.starts_at && new Date(data.starts_at).getTime() > now) {
        toast.error(`Voucher có hiệu lực từ ${new Date(data.starts_at).toLocaleDateString("vi-VN")}`);
        return;
      }
      if (data.expires_at && new Date(data.expires_at).getTime() < now) {
        toast.error("Voucher đã hết hạn");
        return;
      }
      if (data.usage_limit != null && data.used >= data.usage_limit) {
        toast.error("Voucher đã hết lượt sử dụng");
        return;
      }
      const dtype = data.discount_type as "percent" | "fixed";
      const dval = Number(data.discount_value);
      const amount = dtype === "percent"
        ? Math.round((total * dval) / 100)
        : Math.min(total, dval);
      setVoucher({
        id: data.id,
        code: data.code,
        discount_type: dtype,
        discount_value: dval,
        discount_amount: amount,
      });
      toast.success(`Áp dụng voucher ${data.code} thành công`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không áp dụng được voucher";
      toast.error(msg);
    } finally {
      setApplyingVoucher(false);
    }
  }


  function setGuest(i: number, patch: Partial<GuestInfo>) {
    setGuests((g) => g.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }

  function validateInfo() {
    const e: Record<string, string> = {};
    guests.forEach((g, i) => {
      if (!g.name.trim()) e[`name_${i}`] = "Vui lòng nhập họ tên";
      if (!phoneOk(g.phone)) e[`phone_${i}`] = "SĐT phải gồm 8 – 11 chữ số";
      if (!cccdOk(g.cccd)) e[`cccd_${i}`] = "CCCD phải đủ 12 chữ số (hoặc 'TE' với trẻ em dưới 16 tuổi)";
      if (i === 0) {
        if (!emailOk(g.email)) e[`email_${i}`] = "Email không đúng định dạng";
      } else if (g.email.trim() && !emailOk(g.email)) {
        e[`email_${i}`] = "Email không đúng định dạng";
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // Create pending booking on entering step 2 (payment), once.
  const creatingRef = useRef(false);
  useEffect(() => {
    if (step !== 2 || bookingId || creatingRef.current) return;
    creatingRef.current = true;
    setCreatingOrder(true);
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user?.id) {
          toast.error("Vui lòng đăng nhập để hoàn tất đặt chỗ");
          navigate({ to: "/login" });
          return;
        }
        const lead = guests[0];
        const res = await createBooking({
          data: {
            type: bookingType,
            ref_id: refId,
            ref_title: refTitle ?? subtitle,
            total: finalTotal,
            payment_method: payment,
            customer_info: {
              ...(extraInfo ?? {}),
              name: lead.name,
              phone: lead.phone,
              cccd: lead.cccd,
              email: lead.email,
              guests,
              order_info: orderInfo,
              original_total: total,
              voucher: voucher
                ? {
                    id: voucher.id,
                    code: voucher.code,
                    discount_type: voucher.discount_type,
                    discount_value: voucher.discount_value,
                    discount_amount: voucher.discount_amount,
                  }
                : null,
            },
          },
        });
        setBookingId(res.id);
      } catch (err) {
        creatingRef.current = false;
        const msg = err instanceof Error ? err.message : "Không thể tạo đơn";
        toast.error(msg);
      } finally {
        setCreatingOrder(false);
      }
    })();
  }, [step, bookingId, bookingType, refId, refTitle, subtitle, total, finalTotal, voucher, payment, orderInfo, guests, extraInfo, createBooking]);

  // Poll status while waiting for payment confirmation.
  useEffect(() => {
    if (step !== 2 || !bookingId || qrPaid) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await checkStatus({ data: { id: bookingId } });
        if (!cancelled && res.status === "paid") {
          setQrPaid(true);
        }
      } catch {
        /* ignore transient errors */
      }
    };
    void tick();
    const t = setInterval(tick, 3000);
    return () => { cancelled = true; clearInterval(t); };
  }, [step, bookingId, qrPaid, checkStatus]);

  // After payment is confirmed by the backend → only advance UI.
  const finalizedRef = useRef(false);
  useEffect(() => {
    if (!qrPaid || !bookingId || finalizedRef.current) return;
    finalizedRef.current = true;
    toast.success("Đã ghi nhận thanh toán!");
    setStep(3);
  }, [qrPaid, bookingId]);

  async function next() {
    if (step === 0) {
      const err = validateStep0?.();
      if (err) { toast.error(err); return; }
    }
    if (step === 1) {
      if (!validateInfo()) {
        toast.error("Vui lòng kiểm tra lại thông tin");
        return;
      }
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user?.id) {
        toast.error("Vui lòng đăng nhập để tiếp tục thanh toán");
        navigate({ to: "/login" });
        return;
      }
    }
    if (step === 2) return; // advance handled by paid effect
    setStep((s) => Math.min(s + 1, steps.length - 1));
  }

  // Reset payment-related state if user switches payment method while on step 2.
  // (Don't clear the bookingId — same order, different payment channel.)
  useEffect(() => { setVerifying(false); }, [payment]);

  async function onUserConfirmed() {
    if (!bookingId) return;
    setVerifying(true);
    try {
      await confirmPayment({ data: { id: bookingId } });
      // The polling effect will pick up status=paid within a few seconds.
    } catch (err) {
      setVerifying(false);
      const msg = err instanceof Error ? err.message : "Không thể xác nhận thanh toán";
      toast.error(msg);
    }
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <h1 className="text-3xl font-bold font-heading mb-2">{title}</h1>
      <p className="text-muted-foreground mb-8">{subtitle}</p>

      <div className="flex items-center justify-between mb-10">
        {steps.map((s, i) => (
          <div key={s} className="flex-1 flex items-center">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold ${i <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`ml-2 text-sm hidden sm:inline ${i <= step ? "font-medium" : "text-muted-foreground"}`}>{s}</span>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-3 ${i < step ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-8">
        <Card className="p-6">
          {step === 0 && step0}

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="font-semibold text-lg">Thông tin khách hàng ({guests.length} người)</h2>
              {guests.map((g, i) => (
                <div key={i} className="space-y-4 border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      {i === 0 ? "Người đại diện (Khách 1)" : `Khách ${i + 1}`}
                    </h3>
                    {i === 0 && <span className="text-xs text-primary">Nhận email xác nhận</span>}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block">Họ và tên *</Label>
                      <Input value={g.name} onChange={(e) => setGuest(i, { name: e.target.value })} />
                      {errors[`name_${i}`] && <p className="text-xs text-destructive mt-1">{errors[`name_${i}`]}</p>}
                    </div>
                    <div>
                      <Label className="mb-2 block">Số điện thoại * (8–11 số)</Label>
                      <Input inputMode="numeric" maxLength={11} value={g.phone}
                        onChange={(e) => setGuest(i, { phone: e.target.value.replace(/\D/g, "") })} />
                      {errors[`phone_${i}`] && <p className="text-xs text-destructive mt-1">{errors[`phone_${i}`]}</p>}
                    </div>
                    <div>
                      <Label className="mb-2 block">Email {i === 0 ? "*" : "(không bắt buộc)"}</Label>
                      <Input type="email" value={g.email}
                        onChange={(e) => setGuest(i, { email: e.target.value })} />
                      {errors[`email_${i}`] && <p className="text-xs text-destructive mt-1">{errors[`email_${i}`]}</p>}
                    </div>
                    <div>
                      <Label className="mb-2 block">CCCD * (12 số)</Label>
                      <Input maxLength={12} value={g.cccd}
                        onChange={(e) => {
                          const upper = e.target.value.toUpperCase();
                          if (upper === "T" || upper === "TE") setGuest(i, { cccd: upper });
                          else setGuest(i, { cccd: e.target.value.replace(/\D/g, "") });
                        }} />
                      {errors[`cccd_${i}`] && <p className="text-xs text-destructive mt-1">{errors[`cccd_${i}`]}</p>}
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">Lưu ý: Trẻ em dưới 16 tuổi chưa có CCCD điền <b>"TE"</b> vào mục CCCD.</p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Phương thức thanh toán</h2>
              <RadioGroup value={payment} onValueChange={(v) => setPayment(v as "qr" | "momo")} className="space-y-2">
                {[
                  { v: "qr" as const, l: "Chuyển khoản QR" },
                  { v: "momo" as const, l: "Momo" },
                ].map((p) => (
                  <Label key={p.v} className="flex items-center gap-3 border rounded-lg p-4 cursor-pointer hover:bg-accent">
                    <RadioGroupItem value={p.v} />
                    <QrCode className="h-4 w-4 text-primary" />
                    <span className="font-medium">{p.l}</span>
                  </Label>
                ))}
              </RadioGroup>

              <Card className="p-4 mt-4 bg-secondary/30">
                <div className="grid sm:grid-cols-[200px_1fr] gap-5 items-center">
                  <img src={qrUrl} alt={payment === "qr" ? "VietQR TP Bank" : "Momo QR"} className="w-full max-w-[200px] rounded-lg border bg-white p-2" />
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-base">Quét QR để thanh toán</p>
                    {payment === "qr" ? (
                      <>
                        <p><span className="text-muted-foreground">Ngân hàng:</span> <b>TP Bank (TPBank)</b></p>
                        <p><span className="text-muted-foreground">Số tài khoản:</span> <b>{BANK_ACCOUNT}</b></p>
                        <p><span className="text-muted-foreground">Chủ TK:</span> <b>{BANK_OWNER}</b></p>
                      </>
                    ) : (
                      <>
                        <p><span className="text-muted-foreground">Ví Momo:</span> <b>{MOMO_ACCOUNT}</b></p>
                        <p><span className="text-muted-foreground">Chủ ví:</span> <b>{BANK_OWNER}</b></p>
                      </>
                    )}
                    <p><span className="text-muted-foreground">Số tiền:</span> <b className="text-primary">{formatVND(finalTotal)}</b></p>
                    <p><span className="text-muted-foreground">Nội dung:</span> <b>{orderInfo}</b></p>
                    {bookingId && (
                      <p className="text-xs text-muted-foreground">
                        Mã đơn chờ: <span className="font-mono">#{bookingId.slice(0, 8).toUpperCase()}</span>
                      </p>
                    )}

                    {creatingOrder ? (
                      <div className="mt-3 p-3 rounded-lg bg-secondary/60 border text-sm flex items-center gap-2">
                        <span className="inline-block h-3 w-3 rounded-full bg-primary animate-pulse" />
                        <span>Đang tạo đơn chờ thanh toán…</span>
                      </div>
                    ) : (
                      <div className="mt-3 p-3 rounded-lg bg-secondary/60 border text-sm flex items-center gap-2">
                        <span className="inline-block h-3 w-3 rounded-full bg-primary animate-pulse" />
                        <span>
                          {verifying
                            ? "Đang xác nhận giao dịch với ngân hàng…"
                            : "Đang chờ ngân hàng báo có. Hệ thống sẽ tự chuyển bước khi nhận được tiền."}
                        </span>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      disabled={!bookingId || verifying || creatingOrder}
                      onClick={onUserConfirmed}
                    >
                      Tôi đã hoàn tất thanh toán
                    </Button>
                  </div>
                </div>
              </Card>

              <p className="text-xs text-muted-foreground">🔒 Giao dịch được bảo vệ với SSL & mã hóa an toàn.</p>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-10">
              <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500 text-white inline-flex items-center justify-center"><Check className="h-8 w-8" /></div>
              <h2 className="text-2xl font-bold font-heading mt-4">Đặt thành công!</h2>
              {bookingId && (
                <div className="mt-4 inline-flex flex-col items-center gap-2">
                  <p className="text-sm text-muted-foreground">Mã booking của bạn</p>
                  <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg font-mono text-base font-bold">
                    #{bookingId.slice(0, 8).toUpperCase()}
                    <button type="button" className="text-muted-foreground hover:text-primary"
                      onClick={() => { navigator.clipboard.writeText(bookingId); toast.success("Đã sao chép mã booking"); }}
                    ><Copy className="h-4 w-4" /></button>
                    <button type="button" className="text-muted-foreground hover:text-primary"
                      onClick={async () => {
                        const url = `${window.location.origin}/profile?booking=${bookingId}`;
                        const text = `Mã booking WanderViet: #${bookingId.slice(0, 8).toUpperCase()} - ${refTitle ?? subtitle}`;
                        try {
                          if (navigator.share) await navigator.share({ title: "WanderViet", text, url });
                          else { await navigator.clipboard.writeText(`${text}\n${url}`); toast.success("Đã sao chép liên kết chia sẻ"); }
                        } catch { /* user cancelled */ }
                      }}
                    ><Share2 className="h-4 w-4" /></button>
                  </div>
                  <p className="text-xs text-muted-foreground">ID đầy đủ: <span className="font-mono">{bookingId}</span></p>
                </div>
              )}
              <p className="text-muted-foreground mt-4">Hệ thống sẽ gửi email xác nhận tới {guests[0]?.email} sau khi xử lý thanh toán.</p>
              <div className="mt-6 flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate({ to: "/profile" })}>Đơn của tôi</Button>
                <Button onClick={() => navigate({ to: "/" })}>Về trang chủ</Button>
              </div>
            </div>
          )}

          {step < 3 && (
            <div className="flex justify-between mt-8 pt-6 border-t">
              <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>Quay lại</Button>
              {step < 2 && (
                <Button onClick={next}>Tiếp tục</Button>
              )}
            </div>
          )}
        </Card>

        <Card className="p-6 h-fit space-y-4">
          <div>
            <h3 className="font-semibold mb-4">Tóm tắt đơn</h3>
            {summary}
          </div>

          <div className="border-t pt-4">
            <Label className="mb-2 block text-sm font-medium flex items-center gap-1">
              <Tag className="h-3.5 w-3.5" /> Mã giảm giá
            </Label>
            {voucher ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2">
                <div className="text-sm">
                  <div className="font-mono font-bold">{voucher.code}</div>
                  <div className="text-xs text-emerald-700">
                    -{voucher.discount_type === "percent"
                      ? `${voucher.discount_value}%`
                      : formatVND(voucher.discount_value)}
                  </div>
                </div>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => { setVoucher(null); setVoucherCode(""); }}
                  aria-label="Bỏ voucher"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Nhập mã"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyVoucher(); } }}
                  maxLength={32}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={applyVoucher}
                  disabled={applyingVoucher || !voucherCode.trim()}
                >
                  {applyingVoucher ? "..." : "Áp dụng"}
                </Button>
              </div>
            )}
          </div>

          <div className="border-t pt-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tạm tính</span>
              <span>{formatVND(total)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Giảm giá ({voucher?.code})</span>
                <span>-{formatVND(discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t mt-2">
              <span>Tổng cộng</span>
              <span className="text-primary">{formatVND(finalTotal)}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
