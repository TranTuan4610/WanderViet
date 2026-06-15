import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export type ReviewTarget = {
  bookingId: string;
  userId: string;
  type: "tour" | "hotel" | "flight";
  refId: string;
  title: string;
};

type Existing = { id: string; rating: number; comment: string } | null;

export function ReviewDialog({
  open,
  onOpenChange,
  target,
  existing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: ReviewTarget;
  existing: Existing;
  onSaved: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hover, setHover] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(existing?.rating ?? 5);
      setComment(existing?.comment ?? "");
      setHover(0);
    }
  }, [open, existing]);

  const submit = async () => {
    if (rating < 1 || rating > 5) return toast.error("Vui lòng chọn số sao");
    if (comment.trim().length > 1000) return toast.error("Bình luận tối đa 1000 ký tự");
    setSaving(true);
    const payload = {
      user_id: target.userId,
      booking_id: target.bookingId,
      type: target.type,
      ref_id: target.refId,
      rating,
      comment: comment.trim(),
    };
    const { error } = existing
      ? await supabase.from("reviews").update({ rating, comment: comment.trim() }).eq("id", existing.id)
      : await supabase.from("reviews").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(existing ? "Đã cập nhật đánh giá" : "Cảm ơn bạn đã đánh giá!");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? "Sửa đánh giá" : "Viết đánh giá"}</DialogTitle>
          <DialogDescription className="truncate">{target.title}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
                className="p-1"
                aria-label={`${n} sao`}
              >
                <Star className={cn("h-7 w-7 transition", (hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
              </button>
            ))}
            <span className="ml-2 text-sm text-muted-foreground">{rating}/5</span>
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ cảm nhận của bạn..."
            rows={5}
            maxLength={1000}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Đang lưu..." : existing ? "Cập nhật" : "Gửi đánh giá"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
