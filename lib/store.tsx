"use client";
// Vaqtinchalik client-side "backend": Guruhlar va Fayllar sahifalari shu
// orqali bitta umumiy haftalik reja holatini ulashadi. Supabase ulanganda
// bu Context o'rniga real jadval so'rovlari (masalan, React Query) keladi,
// lekin sahifalar API'si (usePlans) deyarli o'zgarmaydi.
import { createContext, useContext, useState, type ReactNode } from "react";
import { DAYS, groups, initialPlans, type PlanItem } from "./mock";

export { groups };

type PlansState = Record<string, Record<string, PlanItem>>;

type AiDayResult = { day: string; topic: string; pages: string; homework: string; file_name?: string };

type Ctx = {
  plans: PlansState;
  setDayItem: (groupId: string, day: string, patch: Partial<PlanItem>) => void;
  clearGroup: (groupId: string) => void;
  applyAiPlan: (groupId: string, days: AiDayResult[]) => void;
};

const PlanContext = createContext<Ctx | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<PlansState>(initialPlans);

  const setDayItem: Ctx["setDayItem"] = (groupId, day, patch) =>
    setPlans((p) => ({ ...p, [groupId]: { ...p[groupId], [day]: { ...p[groupId][day], ...patch } } }));

  const clearGroup: Ctx["clearGroup"] = (groupId) =>
    setPlans((p) => ({
      ...p,
      [groupId]: Object.fromEntries(DAYS.map((d) => [d, { topic: "", material: "", pages: "", homework: "", source: "" as const }])),
    }));

  const applyAiPlan: Ctx["applyAiPlan"] = (groupId, days) =>
    setPlans((p) => {
      const current = p[groupId] ?? {};
      const next = { ...current };
      for (const d of days) {
        if ((DAYS as readonly string[]).includes(d.day)) {
          next[d.day] = {
            topic: d.topic,
            material: d.file_name ?? current[d.day]?.material ?? "",
            pages: d.pages,
            homework: d.homework,
            source: "ai",
          };
        }
      }
      return { ...p, [groupId]: next };
    });

  return (
    <PlanContext.Provider value={{ plans, setDayItem, clearGroup, applyAiPlan }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlans() {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error("usePlans PlanProvider ichida ishlatilishi kerak");
  return ctx;
}
