# Чат Активу — Трекер виконання

Простий веб-інструмент для щоденної відмітки виконання активу.

- Одне посилання для всіх
- Відмітка з датою і часом
- Візуальний список хто зробив / хто ні
- Адмін-панель для управління учасниками
- Готово до деплою на Vercel + Supabase (безкоштовно)

## 1. Налаштування Supabase (5 хвилин)

1. Зайди на [supabase.com](https://supabase.com) і створи новий проект (безкоштовно).
2. Після створення зайди в **SQL Editor** і виконай цей SQL:

```sql
-- Таблиця учасників
create table participants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now()
);

-- Таблиця відміток
create table checkins (
  id uuid default gen_random_uuid() primary key,
  participant_id uuid references participants(id) on delete cascade,
  check_date date not null,
  checked_at timestamptz default now(),
  note text,
  unique(participant_id, check_date)
);

-- Дозволяємо публічний доступ (anon)
alter table participants enable row level security;
alter table checkins enable row level security;

create policy "Public read participants" on participants for select using (true);
create policy "Public insert participants" on participants for insert with check (true);
create policy "Public delete participants" on participants for delete using (true);

create policy "Public read checkins" on checkins for select using (true);
create policy "Public insert checkins" on checkins for insert with check (true);
```

3. Зайди в **Settings → API** і скопіюй:
   - Project URL
   - anon public key

## 2. Локальний запуск

```bash
cd activity-tracker
npm install

# Створи файл .env.local
cp .env.example .env.local
# Впиши свої ключі Supabase і пароль адміна
```

Файл `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_ADMIN_PASSWORD=твій_секретний_пароль
```

Запуск:
```bash
npm run dev
```

Відкрий http://localhost:3000

## 3. Деплой на Vercel

1. Залий цей проєкт на GitHub (або просто затягни папку в Vercel).
2. На Vercel натисни **New Project** → Import.
3. В **Environment Variables** додай ті самі три змінні:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_ADMIN_PASSWORD`
4. Deploy.

Готово! Отримаєш посилання типу `https://activity-tracker.vercel.app`

## Як користуватися

1. Зайди на `/admin` → введи пароль → додай імена учасників.
2. Кинь головне посилання в чат.
3. Люди обирають своє ім'я і натискають кнопку.
4. Всі бачать актуальний статус у реальному часі.

---

Зроблено для чату активу 🔥
