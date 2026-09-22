import { supabaseAi } from "./supabase-ai";
import { DAYS, emptyPlanItem, type PlanItem } from "./constants";

export type PlansByDay = Record<string, PlanItem>;

function startOfWeekIso(date = new Date()): string {
  const d = new Date(date);
  const offset = (d.getDay() + 6) % 7; // Dushanba = 0
  d.setDate(d.getDate() - offset);
  return d.toISOString().slice(0, 10);
}

async function getOrCreateWeeklyPlanId(groupId: string): Promise<string> {
  const weekStart = startOfWeekIso();

  const { data: existing, error: selErr } = await supabaseAi
    .from("weekly_plans")
    .select("id")
    .eq("group_id", groupId)
    .eq("week_start", weekStart)
    .maybeSingle();
  if (selErr) throw new Error(selErr.message);
  if (existing) return existing.id as string;

  const { data: created, error: insErr } = await supabaseAi
    .from("weekly_plans")
    .insert({ group_id: groupId, week_start: weekStart })
    .select("id")
    .single();
  if (insErr) throw new Error(insErr.message);
  return created.id as string;
}

export async function fetchPlan(groupId: string): Promise<PlansByDay> {
  const planId = await getOrCreateWeeklyPlanId(groupId);
  const { data, error } = await supabaseAi
    .from("plan_items")
    .select("day_of_week, topic, material, pages, homework, source")
    .eq("plan_id", planId);
  if (error) throw new Error(error.message);

  const plan: PlansByDay = Object.fromEntries(DAYS.map((d) => [d, emptyPlanItem()]));
  for (const row of data ?? []) {
    plan[row.day_of_week] = {
      topic: row.topic ?? "",
      material: row.material ?? "",
      pages: row.pages ?? "",
      homework: row.homework ?? "",
      source: (row.source as PlanItem["source"]) ?? "",
    };
  }
  return plan;
}

export async function saveDayItem(groupId: string, day: string, item: PlanItem): Promise<void> {
  const planId = await getOrCreateWeeklyPlanId(groupId);
  const { error } = await supabaseAi
    .from("plan_items")
    .upsert({ plan_id: planId, day_of_week: day, ...item }, { onConflict: "plan_id,day_of_week" });
  if (error) throw new Error(error.message);
}

export async function clearPlan(groupId: string): Promise<void> {
  const empty = emptyPlanItem();
  await Promise.all(DAYS.map((day) => saveDayItem(groupId, day, empty)));
}
