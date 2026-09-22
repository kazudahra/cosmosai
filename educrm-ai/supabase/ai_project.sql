-- ============================================================
-- Cosmos AI — AI ma'lumotlari uchun ALOHIDA Supabase loyiha.
-- Buni YANGI, bo'sh Supabase loyihaning SQL Editor'ida ishga tushiring
-- (asosiy CRM loyihada emas!).
--
-- Bu yerdagi group_id / teacher_id / file_id ustunlari ASOSIY loyihadagi
-- ID'larga ishora qiladi, lekin ular BOSHQA bazada bo'lgani uchun haqiqiy
-- foreign key (bog'lanish cheklovi) qo'yib bo'lmaydi — Postgres bazalar
-- orasida FK'ni qo'llab-quvvatlamaydi. Bog'lanish faqat ilova (Next.js)
-- darajasida ta'minlanadi.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Haftalik reja
-- ------------------------------------------------------------
create table if not exists weekly_plans (
  id          text primary key default gen_random_uuid()::text,
  group_id    text not null,   -- asosiy loyihadagi groups.id
  week_start  date not null default date_trunc('week', now())::date,
  created_at  timestamptz default now(),
  unique (group_id, week_start)
);

create table if not exists plan_items (
  id           text primary key default gen_random_uuid()::text,
  plan_id      text not null references weekly_plans(id) on delete cascade,
  day_of_week  text not null,
  topic        text not null default '',
  material     text not null default '',
  pages        text not null default '',
  homework     text not null default '',
  source       text not null default '',   -- '' | 'manual' | 'ai'
  updated_at   timestamptz default now(),
  unique (plan_id, day_of_week)
);

-- ------------------------------------------------------------
-- 2) Fayllar (PDF metadata — haqiqiy fayl shu loyihaning Storage'ida)
-- ------------------------------------------------------------
create table if not exists file_categories (
  id    text primary key default gen_random_uuid()::text,
  name  text not null unique
);
insert into file_categories (name)
values ('Reading'), ('Listening'), ('Writing'), ('Speaking')
on conflict (name) do nothing;

create table if not exists files (
  id           text primary key default gen_random_uuid()::text,
  category_id  text references file_categories(id) on delete set null,
  teacher_id   text,   -- asosiy loyihadagi teachers_hr.id
  name         text not null,
  storage_path text not null,
  size_bytes   bigint default 0,
  created_at   timestamptz default now()
);

-- ------------------------------------------------------------
-- 3) Lug'at
-- ------------------------------------------------------------
create table if not exists vocabulary_sets (
  id         text primary key default gen_random_uuid()::text,
  file_id    text references files(id) on delete cascade,
  topic      text,
  created_at timestamptz default now()
);

create table if not exists vocabulary_words (
  id          text primary key default gen_random_uuid()::text,
  set_id      text not null references vocabulary_sets(id) on delete cascade,
  word        text not null,
  translation text not null,
  example     text
);

-- ------------------------------------------------------------
-- 4) Print navbati
-- ------------------------------------------------------------
create table if not exists print_jobs (
  id          text primary key default gen_random_uuid()::text,
  teacher_id  text,   -- asosiy loyihadagi teachers_hr.id
  file_id     text references files(id) on delete set null,
  file_name   text not null,
  pages       text not null,
  status      text not null default 'queued', -- 'queued' | 'printing' | 'done' | 'failed'
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ------------------------------------------------------------
-- 5) Chat AI tarixi
-- ------------------------------------------------------------
create table if not exists chat_sessions (
  id          text primary key default gen_random_uuid()::text,
  teacher_id  text,   -- asosiy loyihadagi teachers_hr.id
  group_id    text,   -- asosiy loyihadagi groups.id
  created_at  timestamptz default now()
);

create table if not exists chat_messages (
  id          text primary key default gen_random_uuid()::text,
  session_id  text not null references chat_sessions(id) on delete cascade,
  role        text not null,  -- 'user' | 'ai'
  content     text not null,
  created_at  timestamptz default now()
);

-- ============================================================
-- RLS: hozircha auth yo'q, shuning uchun ochiq policy.
-- AUTH QO'SHILGANDA BU YERNI QAYTA YOZING.
-- ============================================================
do $$
declare t text;
begin
  for t in select unnest(array[
    'weekly_plans','plan_items','file_categories','files',
    'vocabulary_sets','vocabulary_words','print_jobs',
    'chat_sessions','chat_messages'
  ])
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "dev_open_all" on %I;', t);
    execute format('create policy "dev_open_all" on %I for all using (true) with check (true);', t);
  end loop;
end $$;

-- public schema odatda avtomatik ruxsatga ega, lekin har ehtimolga qarshi
-- aniq yozib qo'yamiz (yangi Supabase loyihalarida standart o'zgargan
-- bo'lishi mumkin):
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

-- Print navbati uchun real-time
alter publication supabase_realtime add table print_jobs;

-- ============================================================
-- Storage: PDF fayllar uchun bucket
-- ============================================================
insert into storage.buckets (id, name, public)
values ('ai-files', 'ai-files', true)
on conflict (id) do nothing;

drop policy if exists "ai-files public read" on storage.objects;
create policy "ai-files public read" on storage.objects
  for select using (bucket_id = 'ai-files');

drop policy if exists "ai-files public upload" on storage.objects;
create policy "ai-files public upload" on storage.objects
  for insert with check (bucket_id = 'ai-files');

drop policy if exists "ai-files public delete" on storage.objects;
create policy "ai-files public delete" on storage.objects
  for delete using (bucket_id = 'ai-files');
