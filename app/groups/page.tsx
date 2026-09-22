"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Loader2, Sparkles, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useCurrentUser } from "@/lib/current-user";
import { fetchGroupsForTeacher, setGroupBotEnabled, type GroupRow } from "@/lib/groups";
import { fetchPlan, saveDayItem, clearPlan, type PlansByDay } from "@/lib/plans";
import { DAYS, type PlanItem } from "@/lib/constants";

const fields: { key: keyof Omit<PlanItem, "source">; label: string; placeholder: string }[] = [
  { key: "topic", label: "Mavzu", placeholder: "Mavzu nomi" },
  { key: "material", label: "Kitob / fayl", placeholder: "Masalan, Cambridge 17" },
  { key: "pages", label: "Betlar", placeholder: "24-27" },
  { key: "homework", label: "Uy vazifasi", placeholder: "Vazifa" },
];

export default function GroupsPage() {
  const { teacher, loading: teacherLoading } = useCurrentUser();
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [plan, setPlan] = useState<PlansByDay | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teacher) return;
    let active = true;
    setLoadingGroups(true);
    fetchGroupsForTeacher(teacher.id)
      .then((rows) => {
        if (!active) return;
        setGroups(rows);
        setSelectedId((prev) => prev ?? rows[0]?.id ?? null);
      })
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoadingGroups(false));
    return () => {
      active = false;
    };
  }, [teacher]);

  const group = groups.find((g) => g.id === selectedId) ?? groups[0] ?? null;

  useEffect(() => {
    if (!group) return;
    let active = true;
    setLoadingPlan(true);
    fetchPlan(group.id)
      .then((p) => active && setPlan(p))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoadingPlan(false));
    return () => {
      active = false;
    };
  }, [group?.id]);

  const updateField = (day: string, patch: Partial<PlanItem>) => {
    if (!plan) return;
    setPlan({ ...plan, [day]: { ...plan[day], ...patch } });
  };

  const persistField = async (day: string) => {
    if (!plan || !group) return;
    try {
      await saveDayItem(group.id, day, { ...plan[day], source: "manual" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saqlashda xato.");
    }
  };

  const onClear = async () => {
    if (!group) return;
    try {
      await clearPlan(group.id);
      const fresh = await fetchPlan(group.id);
      setPlan(fresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tozalashda xato.");
    }
  };

  const toggleBot = async (g: GroupRow) => {
    const next = !g.ai_bot_enabled;
    setGroups((gs) => gs.map((x) => (x.id === g.id ? { ...x, ai_bot_enabled: next } : x)));
    try {
      await setGroupBotEnabled(g.id, next);
    } catch (err) {
      setGroups((gs) => gs.map((x) => (x.id === g.id ? { ...x, ai_bot_enabled: g.ai_bot_enabled } : x)));
      setError(err instanceof Error ? err.message : "Botni yoqishda xato.");
    }
  };

  if (teacherLoading || loadingGroups) {
    return (
      <>
        <PageHeader title="Guruhlar" />
        <p className="flex items-center gap-2 text-sm text-ink-soft"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Yuklanmoqda...</p>
      </>
    );
  }

  if (!group) {
    return (
      <>
        <PageHeader title="Guruhlar" />
        <p className="rounded-lg border border-dashed border-line p-8 text-center text-sm text-ink-soft">
          Bu o'qituvchiga (teacher_hr_id) hech qanday guruh biriktirilmagan.
        </p>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Guruhlar" hint="Chapda guruhni tanlang, o'ngda haftalik reja. Rejani qo'lda yozing yoki Fayllar bo'limidan AI bilan tuzdiring." />
      {error && <p role="alert" className="mb-4 rounded-md bg-danger-tint p-3 text-sm text-danger">{error}</p>}

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <ul className="space-y-2" aria-label="Guruhlar ro'yxati">
          {groups.map((g) => {
            const active = g.id === group.id;
            return (
              <li key={g.id}>
                <button
                  onClick={() => setSelectedId(g.id)}
                  aria-pressed={active}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    active ? "border-brand bg-brand-tint" : "border-line bg-card hover:border-brand/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{g.name}</span>
                    {g.ai_bot_enabled && <Bot className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-label="Bot ulangan" />}
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">
                    {(g.days ?? []).join(", ") || "Kunlar belgilanmagan"}{g.time ? `, ${g.time}` : ""} · {g.studentCount} o'quvchi
                  </p>
                </button>
              </li>
            );
          })}
        </ul>

        <section className="min-w-0 rounded-lg border border-line bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
            <h2 className="text-lg font-semibold">{group.name}</h2>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={group.ai_bot_enabled} onChange={() => toggleBot(group)} className="h-4 w-4 accent-brand" />
              Bot uy vazifa va fayllarni yuboradi
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-line p-4">
            <Link href="/files" className="btn-primary">
              <Sparkles className="h-4 w-4" aria-hidden />AI bilan reja tuzish (Fayllar bo'limi)
            </Link>
            <button className="btn-ghost" onClick={onClear}>
              <Trash2 className="h-4 w-4" aria-hidden />Rejani tozalash
            </button>
          </div>

          {loadingPlan || !plan ? (
            <p className="flex items-center gap-2 p-4 text-sm text-ink-soft"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Reja yuklanmoqda...</p>
          ) : (
            <div className="divide-y divide-line">
              {DAYS.map((day) => {
                const item = plan[day];
                return (
                  <div key={day} className="grid gap-2 p-4 md:grid-cols-[100px_1.2fr_1.2fr_90px_1.2fr] md:items-end">
                    <div className="flex items-center gap-2 md:block">
                      <p className="text-sm font-medium">{day}</p>
                      {item.source === "ai" && <span className="rounded bg-amber-tint px-1.5 py-0.5 text-xs text-amber">AI</span>}
                    </div>
                    {fields.map((f) => (
                      <label key={f.key} className="block">
                        <span className="mb-1 block text-xs text-ink-soft">{f.label}</span>
                        <input
                          className="w-full"
                          value={item[f.key]}
                          placeholder={f.placeholder}
                          onChange={(e) => updateField(day, { [f.key]: e.target.value })}
                          onBlur={() => persistField(day)}
                        />
                      </label>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
