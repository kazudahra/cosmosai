"use client";
import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Sparkles, Upload } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useCurrentUser } from "@/lib/current-user";
import { fetchGroupsForTeacher, type GroupRow } from "@/lib/groups";
import { fetchCategories, fetchFiles, uploadFile, type FileCategory, type FileRow } from "@/lib/files";

type Notice = { type: "ok" | "error"; text: string };

export default function FilesPage() {
  const { teacher } = useCurrentUser();
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [categories, setCategories] = useState<FileCategory[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [files, setFiles] = useState<FileRow[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [groupId, setGroupId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories()
      .then((cats) => {
        setCategories(cats);
        setCategoryId((prev) => prev || cats[0]?.id || "");
      })
      .catch((err) => setNotice({ type: "error", text: err.message }));
  }, []);

  useEffect(() => {
    if (!teacher) return;
    fetchGroupsForTeacher(teacher.id)
      .then((rows) => {
        setGroups(rows);
        setGroupId((prev) => prev || rows[0]?.id || "");
      })
      .catch((err) => setNotice({ type: "error", text: err.message }));
  }, [teacher]);

  useEffect(() => {
    if (!categoryId) return;
    let active = true;
    setLoadingFiles(true);
    setSelected([]);
    fetchFiles(categoryId)
      .then((rows) => active && setFiles(rows))
      .catch((err) => active && setNotice({ type: "error", text: err.message }))
      .finally(() => active && setLoadingFiles(false));
    return () => {
      active = false;
    };
  }, [categoryId]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (picked.length === 0 || !categoryId) return;

    setUploading(true);
    setNotice(null);
    try {
      for (const file of picked) {
        if (file.type !== "application/pdf") {
          setNotice({ type: "error", text: `"${file.name}" PDF emas, o'tkazib yuborildi.` });
          continue;
        }
        await uploadFile(file, categoryId, teacher?.id ?? null);
      }
      const fresh = await fetchFiles(categoryId);
      setFiles(fresh);
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "Yuklashda xato." });
    } finally {
      setUploading(false);
    }
  };

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const generate = async () => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) {
      setNotice({ type: "error", text: "Avval qaysi guruh uchun reja tuzishni tanlang." });
      return;
    }
    if (selected.length === 0) return;

    setGenerating(true);
    setNotice(null);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: group.id, groupName: group.name, fileIds: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Xatolik yuz berdi.");
      setNotice({ type: "ok", text: `"${group.name}" uchun haftalik reja tuzildi va saqlandi. Guruhlar bo'limida tekshiring.` });
    } catch (err) {
      setNotice({ type: "error", text: err instanceof Error ? err.message : "AI bilan bog'lanishda xatolik." });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <PageHeader title="Fayllar" hint="Bo'limlarga PDF kitoblarni yuklang. Tanlangan fayllar asosida, tanlangan guruh uchun AI haftalik reja tuzib beradi." />

      <div role="tablist" className="mb-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={c.id === categoryId}
            onClick={() => setCategoryId(c.id)}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              c.id === categoryId ? "border-brand bg-brand text-white" : "border-line bg-card hover:border-brand/40"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <section className="rounded-lg border border-line bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-4">
          <h2 className="font-semibold">{categories.find((c) => c.id === categoryId)?.name ?? ""} kitoblari</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input ref={input} type="file" accept="application/pdf" multiple hidden onChange={onUpload} />
            <button className="btn-ghost" disabled={uploading} onClick={() => input.current?.click()}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Upload className="h-4 w-4" aria-hidden />}
              PDF yuklash
            </button>
            {groups.length > 0 && (
              <select aria-label="Guruh" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            )}
            <button className="btn-primary" disabled={selected.length === 0 || generating} onClick={generate}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
              AI bilan reja tuzish
            </button>
          </div>
        </div>

        {loadingFiles ? (
          <p className="flex items-center gap-2 p-8 text-sm text-ink-soft"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Yuklanmoqda...</p>
        ) : files.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-soft">Bu bo'limda fayl yo'q. PDF yuklashdan boshlang.</p>
        ) : (
          <ul className="divide-y divide-line">
            {files.map((f) => (
              <li key={f.id}>
                <label className="flex cursor-pointer items-center gap-3 p-4 hover:bg-paper">
                  <input type="checkbox" className="h-4 w-4 accent-brand" checked={selected.includes(f.id)} onChange={() => toggle(f.id)} />
                  <FileText className="h-5 w-5 text-brand" aria-hidden />
                  <span className="flex-1 text-sm font-medium">{f.name}</span>
                  <span className="text-xs text-ink-soft">{(f.size_bytes / 1024 / 1024).toFixed(1)} MB</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      {notice && (
        <p
          role="status"
          className={`mt-4 rounded-md p-3 text-sm ${notice.type === "ok" ? "bg-brand-tint text-brand-dark" : "bg-danger-tint text-danger"}`}
        >
          {notice.text}
        </p>
      )}
    </>
  );
}
