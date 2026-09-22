export const DAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"] as const;
export type DayName = (typeof DAYS)[number];

export type PlanItem = {
  topic: string;
  material: string;
  pages: string;
  homework: string;
  source: "ai" | "manual" | "";
};

export function emptyPlanItem(): PlanItem {
  return { topic: "", material: "", pages: "", homework: "", source: "" };
}
