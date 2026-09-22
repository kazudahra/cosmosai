"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useCurrentUser } from "@/lib/current-user";
import { fetchGroupsForTeacher, type GroupRow } from "@/lib/groups";
import { getOrCreateSession, fetchMessages, addMessage, type ChatMessage } from "@/lib/chat";

const quick = ["Guruh natijalarini tahlil qil", "10 ta savolli test tuz", "Zaif o'quvchilar uchun tavsiya ber"];

// Chat AI hali Gemini'ga ulanmagan (demo javob) — tarix esa haqiqatan
// saqlanadi, shuning uchun sahifa yangilansa suhbat yo'qolmaydi.
const mockReply = (q: string, groupName: string): string => {
  if (/test/i.test(q)) return `«${groupName}» uchun test tayyorlanadi. (Demo javob: keyingi bosqichda Gemini ulanadi.)`;
  if (/tavsiya/i.test(q)) return "Zaif o'quvchilar uchun qo'shimcha mashqlar tavsiya etiladi. (Demo javob)";
  return `«${groupName}» bo'yicha tahlil tayyorlanadi: davomat, uy vazifasi va test ballari. (Demo javob)`;
};

export default function ChatPage() {
  const { teacher } = useCurrentUser();
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [groupId, setGroupId] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!teacher) return;
    fetchGroupsForTeacher(teacher.id).then((rows) => {
      setGroups(rows);
      setGroupId((prev) => prev || rows[0]?.id || "");
    });
  }, [teacher]);

  useEffect(() => {
    if (!teacher || !groupId) return;
    let active = true;
    setLoading(true);
    (async () => {
      const sid = await getOrCreateSession(teacher.id, groupId);
      if (!active) return;
      setSessionId(sid);
      const history = await fetchMessages(sid);
      if (active) setMessages(history);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [teacher, groupId]);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const group = groups.find((g) => g.id === groupId);

  const send = async (q: string) => {
    if (!q.trim() || !group || !sessionId || sending) return;
    setSending(true);
    setText("");
    const reply = mockReply(q, group.name);
    setMessages((m) => [...m, { role: "user", content: q }, { role: "ai", content: reply }]);
    try {
      await addMessage(sessionId, "user", q);
      await addMessage(sessionId, "ai", reply);
    } catch {
      // Xabar UI'da ko'rinadi, lekin saqlanmagan bo'lishi mumkin — jiddiy emas, demo bosqich.
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader title="Chat AI" hint="Tanlangan guruh o'quvchilari bo'yicha tahlil, test va tavsiyalar oling. Suhbat tarixi saqlanadi.">
        {groups.length > 0 && (
          <select aria-label="Guruh" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        )}
      </PageHeader>

      <section className="flex h-[65vh] flex-col rounded-lg border border-line bg-card">
        <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-ink-soft"><Loader2 className="h-4 w-4 animate-spin" aria-hidden />Yuklanmoqda...</p>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm text-ink-soft">Savol yozing yoki tayyor so'rovlardan birini tanlang.</p>
              <div className="flex flex-wrap justify-center gap-2">
                {quick.map((q) => <button key={q} className="btn-ghost" onClick={() => send(q)}>{q}</button>)}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : ""}`}>
                <p className={`max-w-[80%] rounded-lg px-3.5 py-2 text-sm ${m.role === "user" ? "bg-brand text-white" : "bg-paper"}`}>{m.content}</p>
              </div>
            ))
          )}
          <div ref={end} />
        </div>
        <div className="flex gap-2 border-t border-line p-3">
          <input
            className="flex-1"
            value={text}
            placeholder="Savolingizni yozing"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(text)}
          />
          <button className="btn-primary" onClick={() => send(text)} aria-label="Yuborish" disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
          </button>
        </div>
      </section>
    </>
  );
}
