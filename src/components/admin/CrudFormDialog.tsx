import { useEffect, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type FieldDef = {
  key: string;
  label: string;
  type?: "text" | "number" | "image" | "images" | "textarea" | "list" | "schedule";
  placeholder?: string;
  required?: boolean;
  hint?: string;
};

type Props<T> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FieldDef[];
  initial?: Partial<T>;
  onSubmit: (values: Record<string, unknown>) => void;
  extra?: ReactNode;
};

type AnyVal = string | number | string[] | { day: number; title: string; detail: string }[];

function toFieldString(type: FieldDef["type"], val: unknown): string {
  if (type === "list" || type === "images") {
    if (Array.isArray(val)) return (val as string[]).join("\n");
    return typeof val === "string" ? val : "";
  }
  if (type === "schedule") {
    if (Array.isArray(val)) {
      return (val as { day: number; title: string; detail: string }[])
        .map((s) => `${s.title} | ${s.detail}`).join("\n");
    }
    return typeof val === "string" ? val : "";
  }
  return (val ?? "") as string;
}

function fromFieldString(type: FieldDef["type"], raw: string): AnyVal {
  if (type === "list" || type === "images") {
    return raw.split("\n").map((s) => s.trim()).filter(Boolean);
  }
  if (type === "schedule") {
    return raw.split("\n").map((s) => s.trim()).filter(Boolean).map((line, i) => {
      const [title, ...rest] = line.split("|");
      return { day: i + 1, title: (title ?? "").trim(), detail: rest.join("|").trim() };
    });
  }
  return raw;
}

export function CrudFormDialog<T>({ open, onOpenChange, title, description, fields, initial, onSubmit, extra }: Props<T>) {
  const [values, setValues] = useState<Record<string, AnyVal>>({});

  useEffect(() => {
    if (open) {
      const v: Record<string, AnyVal> = {};
      fields.forEach((f) => {
        const init = initial?.[f.key as keyof T] as unknown;
        if (f.type === "list" || f.type === "schedule" || f.type === "images") {
          v[f.key] = (init as AnyVal) ?? [];
        } else {
          v[f.key] = (init ?? (f.type === "number" ? 0 : "")) as AnyVal;
        }
      });
      setValues(v);
    }
  }, [open, initial, fields]);

  const set = (k: string, v: AnyVal) => setValues((p) => ({ ...p, [k]: v }));

  async function appendImageFiles(key: string, files: FileList | null) {
    if (!files || !files.length) return;
    const current = (values[key] as string[]) ?? [];
    const reads: Promise<string>[] = [];
    for (const f of Array.from(files)) {
      if (f.size > 4 * 1024 * 1024) continue;
      reads.push(new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result || ""));
        r.onerror = rej;
        r.readAsDataURL(f);
      }));
    }
    const urls = await Promise.all(reads);
    set(key, [...current, ...urls.filter(Boolean)]);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-4 py-2">
          {fields.map((f) => {
            const raw = values[f.key];
            const span = ["textarea", "image", "images", "list", "schedule"].includes(f.type ?? "") ? "sm:col-span-2" : "";
            const strVal = toFieldString(f.type, raw);
            return (
              <div key={f.key} className={span}>
                <Label className="mb-1.5 block text-sm">{f.label}{f.required && <span className="text-destructive"> *</span>}</Label>
                {f.type === "textarea" ? (
                  <Textarea value={strVal} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} rows={3} />
                ) : f.type === "list" ? (
                  <>
                    <Textarea value={strVal} onChange={(e) => set(f.key, fromFieldString("list", e.target.value))} placeholder={f.placeholder ?? "Mỗi dòng một mục"} rows={4} />
                    {f.hint && <p className="text-xs text-muted-foreground mt-1">{f.hint}</p>}
                  </>
                ) : f.type === "schedule" ? (
                  <>
                    <Textarea value={strVal} onChange={(e) => set(f.key, fromFieldString("schedule", e.target.value))} placeholder={f.placeholder ?? "Tiêu đề ngày | Chi tiết (mỗi dòng = 1 ngày)"} rows={5} />
                    {f.hint && <p className="text-xs text-muted-foreground mt-1">{f.hint}</p>}
                  </>
                ) : f.type === "image" ? (
                  <div className="space-y-2">
                    <Input value={strVal} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder ?? "https://... hoặc /src/assets/..."} />
                    {strVal && <img src={strVal} alt="preview" className="h-24 w-40 rounded object-cover border" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />}
                  </div>
                ) : f.type === "images" ? (
                  <div className="space-y-2">
                    <Textarea value={strVal} onChange={(e) => set(f.key, fromFieldString("images", e.target.value))} placeholder={f.placeholder ?? "Mỗi dòng một URL ảnh"} rows={3} />
                    <div className="flex items-center gap-3 flex-wrap">
                      <label className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded border cursor-pointer hover:bg-accent">
                        + Tải ảnh từ máy
                        <input type="file" accept="image/*" multiple className="hidden"
                          onChange={(e) => { void appendImageFiles(f.key, e.target.files); e.target.value = ""; }} />
                      </label>
                      {(Array.isArray(raw) ? (raw as string[]) : []).map((src, i) => (
                        <div key={i} className="relative group">
                          <img src={src} alt="" className="h-16 w-24 rounded object-cover border" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
                          <button type="button"
                            onClick={() => set(f.key, ((raw as string[]) ?? []).filter((_, idx) => idx !== i))}
                            className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs leading-none opacity-0 group-hover:opacity-100 transition">×</button>
                        </div>
                      ))}
                    </div>
                    {f.hint && <p className="text-xs text-muted-foreground mt-1">{f.hint}</p>}
                  </div>
                ) : (
                  <Input type={f.type === "number" ? "number" : "text"} value={strVal as string | number}
                    onChange={(e) => set(f.key, f.type === "number" ? +e.target.value : e.target.value)}
                    placeholder={f.placeholder} />
                )}
              </div>
            );
          })}
        </div>
        {extra}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={() => {
            for (const f of fields) {
              const val = values[f.key];
              const empty = val === "" || val === undefined || val === null;
              if (f.required && empty) return;
            }
            onSubmit(values);
            onOpenChange(false);
          }}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
