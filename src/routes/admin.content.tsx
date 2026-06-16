import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CrudFormDialog, type FieldDef } from "@/components/admin/CrudFormDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminDeleteContentPost, adminListContentPosts, adminUpsertContentPost } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/content")({ component: AdminContent });

type ContentPost = {
  id: string;
  type: string;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  image?: string | null;
  href?: string | null;
  published: boolean;
  created_at: string;
  updated_at?: string | null;
};

const fields: FieldDef[] = [
  { key: "type", label: "Loại nội dung", required: true, placeholder: "blog / news / banner / homepage" },
  { key: "title", label: "Tiêu đề", required: true },
  { key: "subtitle", label: "Mô tả ngắn" },
  { key: "body", label: "Nội dung", type: "textarea" },
  { key: "image", label: "Ảnh (URL)", type: "image" },
  { key: "href", label: "Đường dẫn", placeholder: "/tours hoặc https://..." },
  { key: "published", label: "Xuất bản", placeholder: "true hoặc false" },
];

function AdminContent() {
  const [rows, setRows] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContentPost | null>(null);
  const listContent = useServerFn(adminListContentPosts);
  const saveContent = useServerFn(adminUpsertContentPost);
  const deleteContent = useServerFn(adminDeleteContentPost);

  const reload = async () => {
    setLoading(true);
    try {
      const data = await listContent();
      setRows((data ?? []) as ContentPost[]);
    } catch (e) {
      toast.error((e as Error).message || "Không tải được nội dung");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const handleSubmit = async (v: Record<string, unknown>) => {
    const publishedRaw = String(v.published ?? editing?.published ?? "true").toLowerCase().trim();
    const payload = {
      type: String(v.type || "blog"),
      title: String(v.title || ""),
      subtitle: v.subtitle ? String(v.subtitle) : null,
      body: v.body ? String(v.body) : null,
      image: v.image ? String(v.image) : null,
      href: v.href ? String(v.href) : null,
      published: !["false", "0", "no", "không"].includes(publishedRaw),
    };
    try {
      await saveContent({ data: { id: editing?.id ?? null, values: payload } });
      await reload();
      toast.success(editing ? "Đã cập nhật nội dung" : "Đã thêm nội dung");
    } catch (e) {
      toast.error((e as Error).message || "Không lưu được nội dung");
      throw e;
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading">Quản lý nội dung</h1>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />Thêm nội dung
        </Button>
      </div>

      <Card className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Link</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Đang tải...</TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Chưa có nội dung nào</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium">{r.title}</div>
                      {r.subtitle && <div className="text-xs text-muted-foreground line-clamp-1">{r.subtitle}</div>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{r.type}</TableCell>
                <TableCell><Badge variant={r.published ? "default" : "secondary"}>{r.published ? "published" : "draft"}</Badge></TableCell>
                <TableCell className="text-xs max-w-xs truncate">{r.href || "—"}</TableCell>
                <TableCell className="text-xs">{new Date(r.created_at).toLocaleString("vi-VN")}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={async () => {
                    try {
                      await deleteContent({ data: { id: r.id } });
                      await reload();
                      toast.success("Đã xóa nội dung");
                    } catch (e) {
                      toast.error((e as Error).message || "Không xóa được nội dung");
                    }
                  }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <CrudFormDialog<Record<string, unknown>>
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Chỉnh sửa nội dung" : "Thêm nội dung"}
        fields={fields}
        initial={editing ? { ...editing, published: String(editing.published) } : { type: "blog", published: "true" }}
        onSubmit={handleSubmit}
      />
    </>
  );
}
