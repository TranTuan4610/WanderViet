import { useMemo } from "react";
import { cn } from "@/lib/utils";

export type SeatClass = "eco" | "premium" | "business";

const ROWS = 20;
const COLS = ["A", "B", "C", "D", "E", "F"] as const;
const BUSINESS_ROWS = 3; // rows 1-3

function seatId(row: number, col: string) {
  return `${row}${col}`;
}

// Deterministic pseudo-random "occupied" seats based on flight id + date
function occupiedSet(seed: string): Set<string> {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const set = new Set<string>();
  for (let r = 1; r <= ROWS; r++) {
    for (const c of COLS) {
      h = (h * 1103515245 + 12345) >>> 0;
      if ((h % 100) < 22) set.add(seatId(r, c));
    }
  }
  return set;
}

export type SeatMapProps = {
  seed: string;
  cls: SeatClass;
  capacity: number;
  selected: string[];
  onChange: (seats: string[]) => void;
};

export function SeatMap({ seed, cls, capacity, selected, onChange }: SeatMapProps) {
  const occupied = useMemo(() => occupiedSet(seed), [seed]);

  function toggle(id: string, isBusinessSeat: boolean) {
    if (occupied.has(id)) return;
    // Economy/premium passengers can't pick business seats
    if (isBusinessSeat && cls !== "business") return;

    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
      return;
    }
    if (selected.length >= capacity) {
      // replace the first selected to keep within capacity
      onChange([...selected.slice(1), id]);
      return;
    }
    onChange([...selected, id]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded bg-muted border" />Trống</span>
        <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded bg-primary" />Đang chọn</span>
        <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded bg-destructive/70" />Đã đặt</span>
        <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded bg-amber-200 border border-amber-400" />Thương gia</span>
      </div>

      <div className="rounded-xl border bg-card p-4 overflow-x-auto">
        <div className="mx-auto w-fit space-y-1.5">
          <div className="text-center text-xs text-muted-foreground mb-2">✈ Đầu máy bay</div>
          {Array.from({ length: ROWS }, (_, i) => i + 1).map((r) => {
            const isBusiness = r <= BUSINESS_ROWS;
            return (
              <div key={r} className="flex items-center gap-1.5">
                <span className="w-6 text-right text-xs text-muted-foreground">{r}</span>
                {COLS.map((c, idx) => {
                  const id = seatId(r, c);
                  const isOcc = occupied.has(id);
                  const isSel = selected.includes(id);
                  const blocked = isBusiness && cls !== "business";
                  return (
                    <div key={c} className="flex items-center">
                      <button
                        type="button"
                        onClick={() => toggle(id, isBusiness)}
                        disabled={isOcc || blocked}
                        title={isOcc ? `${id} - đã đặt` : blocked ? `${id} - hạng thương gia` : id}
                        className={cn(
                          "h-8 w-8 rounded-md text-[10px] font-semibold border transition",
                          isOcc && "bg-destructive/70 text-white cursor-not-allowed",
                          !isOcc && isSel && "bg-primary text-primary-foreground border-primary",
                          !isOcc && !isSel && isBusiness && "bg-amber-100 hover:bg-amber-200 border-amber-400",
                          !isOcc && !isSel && !isBusiness && "bg-muted hover:bg-secondary",
                          blocked && !isOcc && "opacity-40 cursor-not-allowed",
                        )}
                      >
                        {id}
                      </button>
                      {idx === 2 && <span className="w-3" />}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
