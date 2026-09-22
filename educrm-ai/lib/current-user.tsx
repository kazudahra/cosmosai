"use client";
// Auth qo'shilguncha "joriy o'qituvchi"ni shu Context orqali qo'lda
// tanlaymiz (Shell.tsx pastida dropdown). Ro'yxat public.teachers_hr
// jadvalidan real vaqtda o'qiladi. Auth qo'shilganda faqat shu fayl
// o'zgaradi: teacher Supabase sessiyasidan olinadi, boshqa hech qanday
// sahifa o'zgarmaydi.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";

export type Teacher = { id: string; name: string };

type Ctx = {
  teacher: Teacher | null;
  teachers: Teacher[];
  setTeacherId: (id: string) => void;
  loading: boolean;
  error: string | null;
};

const CurrentUserContext = createContext<Ctx | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [id, setId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from("teachers_hr")
        .select("id, name")
        .eq("role", "teacher")
        .order("name");
      if (!active) return;
      if (error) {
        setError(error.message);
      } else {
        setTeachers(data ?? []);
        setId((prev) => prev || data?.[0]?.id || "");
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const teacher = teachers.find((t) => t.id === id) ?? null;

  return (
    <CurrentUserContext.Provider value={{ teacher, teachers, setTeacherId: setId, loading, error }}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) throw new Error("useCurrentUser CurrentUserProvider ichida ishlatilishi kerak");
  return ctx;
}
