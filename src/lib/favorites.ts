import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type FavoriteType = "tour" | "hotel";

export type FavoriteRow = {
  id: string;
  type: FavoriteType;
  ref_id: string;
  ref_title: string | null;
  ref_image: string | null;
  ref_price: number | null;
  created_at: string;
};

export type FavoriteInput = {
  type: FavoriteType;
  refId: string;
  title?: string;
  image?: string;
  price?: number;
};

export function useFavorites() {
  const { user } = useAuth();
  const [items, setItems] = useState<FavoriteRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("favorites")
      .select("id, type, ref_id, ref_title, ref_image, ref_price, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) setItems((data ?? []) as FavoriteRow[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const isFavorite = useCallback(
    (type: FavoriteType, refId: string) =>
      items.some((f) => f.type === type && f.ref_id === refId),
    [items],
  );

  const toggle = useCallback(
    async (input: FavoriteInput) => {
      if (!user?.id) {
        toast.error("Vui lòng đăng nhập để lưu yêu thích");
        return false;
      }
      const existing = items.find((f) => f.type === input.type && f.ref_id === input.refId);
      if (existing) {
        const { error } = await supabase.from("favorites").delete().eq("id", existing.id);
        if (error) { toast.error("Không thể bỏ yêu thích"); return true; }
        setItems((prev) => prev.filter((f) => f.id !== existing.id));
        toast.success("Đã bỏ khỏi yêu thích");
        return false;
      }
      const { data, error } = await supabase
        .from("favorites")
        .insert({
          user_id: user.id,
          type: input.type,
          ref_id: input.refId,
          ref_title: input.title ?? null,
          ref_image: input.image ?? null,
          ref_price: input.price ?? null,
        })
        .select("id, type, ref_id, ref_title, ref_image, ref_price, created_at")
        .single();
      if (error || !data) { toast.error("Không thể lưu yêu thích"); return false; }
      setItems((prev) => [data as FavoriteRow, ...prev]);
      toast.success("Đã lưu vào yêu thích");
      return true;
    },
    [user?.id, items],
  );

  return { items, loading, isFavorite, toggle, reload: load };
}
