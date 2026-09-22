"use client";
import { useEffect, useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { fetchCategories, fetchFiles, type FileCategory, type FileRow } from "@/lib/files";
import { fetchLatestVocabulary, type VocabWord } from "@/lib/vocabulary";

export default function VocabularyPage() {
  const [categories, setCategories] = useState<FileCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [files, setFiles] = useState<FileRow[]>([]);
  const [fileId, setFileId] = useState("");
  const [topic, setTopic] = useState("");
  const [words, setWords] = useState<VocabWord[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadingPrevious, setLoadingPrevious] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories()
      .then((cats) => {
        setCategories(cats);
        setCategoryId((prev) => prev || cats[0]?.id || "");
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!categoryId) return;
    let active = true;
    setLoadingFiles(true);
    fetchFiles(categoryId)
      .then((rows) => {
        if (!active) return;
        setFiles(rows);
        setFileId(rows[0]?.id ?? "");
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoadingFiles(false));
    return () => {
      active = false;
    };
  }, [categoryId]);

  // Fayl tanlanganda, oldin ajratilgan lug'at bo'lsa avtomatik ko'rsatamiz —
  // sahifa yangilansa ham natija yo'qolmasligi uchun.
  useEffect(() => {
    if (!fileId) {
      setWords([]);
      return;
    }
    let active = true;
    setLoadingPrevious(true);
    fetchLatestVocabulary(fileId)
      .then((res) => {
        if (!active) return;
        if (res) {
          setWords(res.words);
          setTopic(res.topic ?? "");
        } else {
          setWords([]);
        }
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoadingPrevious(false));
    return () => {
      active = false;
    };
  }, [fileId]);

  const extract = async () => {
    if (!fileId) {
      setError("Avval fayl tanlang.");
      return;
    }
    setExtracting(true);
    setError("");
    try {
      const res = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Xatolik yuz berdi.");
      setWords(data.words ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI bilan bog'lanishda xatolik.");
    } finally {
      setExtracting(false);
    }
  };

  return (
    <>
      <PageHeader title="Lug'at" hint="Fayl va (ixtiyoriy) mavzuni tanlang — AI shu mavzuga oid so'zlarni PDF ichidan ajratib beradi va natija saqlanib qoladi." />

      <section className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-line bg-card p-4">
        <label className="text-sm">
          Bo'lim
          <select className="mt-1 block" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="text-sm">
          Fayl
          {loadingFiles ? (
            <p className="mt-1 text-xs text-ink-soft">Yuklanmoqda...</p>
          ) : files.length === 0 ? (
            <p className="mt-1 text-xs text-ink-soft">Bu bo'limda fayl yo'q</p>
          ) : (
            <select className="mt-1 block" value={fileId} onChange={(e) => setFileId(e.target.value)}>
              {files.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          )}
        </label>
        <label className="text-sm">
          Mavzu (ixtiyoriy)
          <input className="mt-1 block" value={topic} placeholder="Masalan, Environment" onChange={(e) => setTopic(e.target.value)} />
        </label>
        <button className="btn-primary" disabled={extracting || !fileId} onClick={extract}>
          {extracting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Wand2 className="h-4 w-4" aria-hidden />}
          Lug'atni ajratish
        </button>
      </section>

      {error && <p role="alert" className="mb-4 rounded-md bg-danger-tint p-3 text-sm text-danger">{error}</p>}

      {loadingPrevious ? (
        <p className="flex items-center gap-2 text-sm text-ink-soft"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Yuklanmoqda...</p>
      ) : words.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line p-8 text-center text-sm text-ink-soft">Bu fayl uchun hali lug'at ajratilmagan.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper text-ink-soft">
              <tr>
                <th className="p-3 font-medium">So'z</th>
                <th className="p-3 font-medium">Tarjima</th>
                <th className="p-3 font-medium">Misol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {words.map((w, i) => (
                <tr key={`${w.word}-${i}`}>
                  <td className="p-3 font-medium">{w.word}</td>
                  <td className="p-3">{w.translation}</td>
                  <td className="p-3 text-ink-soft">{w.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
