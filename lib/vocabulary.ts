import { supabaseAi } from "./supabase-ai";

export type VocabWord = { word: string; translation: string; example: string };

// Shu fayl uchun oldin ajratilgan eng oxirgi lug'atni qaytaradi (bo'lsa).
// Sahifa yangilansa ham natija yo'qolmasligi uchun kerak.
export async function fetchLatestVocabulary(fileId: string): Promise<{ topic: string | null; words: VocabWord[] } | null> {
  const { data: set, error: setErr } = await supabaseAi
    .from("vocabulary_sets")
    .select("id, topic")
    .eq("file_id", fileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (setErr) throw new Error(setErr.message);
  if (!set) return null;

  const { data: words, error: wErr } = await supabaseAi
    .from("vocabulary_words")
    .select("word, translation, example")
    .eq("set_id", set.id);
  if (wErr) throw new Error(wErr.message);

  return { topic: set.topic, words: words ?? [] };
}
