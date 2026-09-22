// Vaqtinchalik ma'lumotlar. Keyin Supabase so'rovlari bilan almashtiriladi.
export type Teacher = { id: string; name: string };
export type Group = {
  id: string; name: string; teacherId: string;
  days: string; time: string; students: number; avgScore: number; botOn: boolean;
};
export type PlanItem = { topic: string; material: string; pages: string; homework: string; source: "ai" | "manual" | "" };
export type FileItem = { id: string; name: string; category: string; pages: number };

export const DAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"] as const;
export const CATEGORIES = ["Reading", "Listening", "Writing", "Speaking"] as const;

export const teachers: Teacher[] = [
  { id: "t1", name: "Malika Yusupova" },
  { id: "t2", name: "Jasur Karimov" },
];

export const groups: Group[] = [
  { id: "g1", name: "IELTS 6.5 — kechki", teacherId: "t1", days: "Du-Chor-Ju", time: "18:00", students: 12, avgScore: 6.0, botOn: true },
  { id: "g2", name: "IELTS 5.5 — ertalab", teacherId: "t1", days: "Se-Pay-Sha", time: "09:00", students: 9, avgScore: 5.0, botOn: false },
  { id: "g3", name: "General English B1", teacherId: "t2", days: "Du-Chor-Ju", time: "15:00", students: 14, avgScore: 4.5, botOn: true },
];

export const emptyItem = (): PlanItem => ({ topic: "", material: "", pages: "", homework: "", source: "" });

export const initialPlans: Record<string, Record<string, PlanItem>> = Object.fromEntries(
  groups.map((g) => [g.id, Object.fromEntries(DAYS.map((d) => [d, emptyItem()]))])
);
initialPlans.g1.Dushanba = { topic: "Matching Headings", material: "Cambridge IELTS 17", pages: "24-27", homework: "Passage 2 savollari", source: "manual" };

export const initialFiles: FileItem[] = [
  { id: "f1", name: "Cambridge IELTS 17.pdf", category: "Reading", pages: 176 },
  { id: "f2", name: "Cambridge IELTS 16.pdf", category: "Listening", pages: 168 },
  { id: "f3", name: "Writing Task 2 Collection.pdf", category: "Writing", pages: 92 },
];

export const aiSampleTopics = [
  { topic: "True / False / Not Given", material: "Cambridge IELTS 17", pages: "30-33", homework: "Test 2, Passage 1" },
  { topic: "Sentence Completion", material: "Cambridge IELTS 17", pages: "34-37", homework: "Test 2, Passage 2" },
  { topic: "Summary Completion", material: "Cambridge IELTS 17", pages: "38-41", homework: "Lug'atni takrorlash" },
  { topic: "Multiple Choice", material: "Cambridge IELTS 17", pages: "42-45", homework: "Test 3, Passage 1" },
  { topic: "Timed Reading Practice", material: "Cambridge IELTS 17", pages: "46-52", homework: "Xatolar ustida ishlash" },
  { topic: "Mini mock test", material: "Cambridge IELTS 17", pages: "53-60", homework: "Natijani tahlil qilish" },
];
