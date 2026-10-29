"use client";

import { useEffect, useState } from "react";
import { format, subDays } from "date-fns";
import { uk } from "date-fns/locale";
import { supabase, Participant } from "@/lib/supabase";
import { getLogicalDate, getLogicalYesterday } from "@/lib/date-utils";

type YesterdayCheckin = {
  id: string;
  name: string;
  checked_at: string;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuth, setIsAuth] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [yesterdayCheckins, setYesterdayCheckins] = useState<YesterdayCheckin[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cleanupMsg, setCleanupMsg] = useState("");

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

  const yesterday = getLogicalYesterday();
  const yesterdayNice = format(subDays(new Date(), 1), "d MMMM", { locale: uk });
  const twoDaysAgo = format(subDays(new Date(), 2), "yyyy-MM-dd");

  useEffect(() => {
    const saved = localStorage.getItem("admin_auth");
    if (saved === "true") {
      setIsAuth(true);
      loadAll();
    }
  }, []);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadParticipants(), loadYesterday(), cleanupOldRecords()]);
    setLoading(false);
  }

  async function loadParticipants() {
    const { data, error } = await supabase
      .from("participants")
      .select("*")
      .order("name");

    if (error) {
      setError("Помилка завантаження учасників");
    } else {
      setParticipants(data || []);
    }
  }

  async function loadYesterday() {
    const { data, error } = await supabase
      .from("checkins")
      .select(`
        id,
        checked_at,
        participants (
          name
        )
      `)
      .eq("check_date", yesterday)
      .order("checked_at");

    if (!error && data) {
      const list: YesterdayCheckin[] = data.map((item: any) => ({
        id: item.id,
        name: item.participants?.name || "Невідомий",
        checked_at: item.checked_at,
      }));
      setYesterdayCheckins(list);
    }
  }

  async function cleanupOldRecords() {
    const { error, count } = await supabase
      .from("checkins")
      .delete({ count: "exact" })
      .lt("check_date", twoDaysAgo);

    if (!error && count && count > 0) {
      setCleanupMsg(`Автоматично видалено ${count} старих записів`);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuth(true);
      localStorage.setItem("admin_auth", "true");
      loadAll();
      setError("");
    } else {
      setError("Невірний пароль");
    }
  }

  async function addParticipant(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    const { error } = await supabase.from("participants").insert({
      name: newName.trim(),
    });

    if (error) {
      setError("Не вдалося додати");
    } else {
      setNewName("");
      loadParticipants();
    }
  }

  async function removeParticipant(id: string) {
    if (!confirm("Видалити учасника?")) return;

    const { error } = await supabase.from("participants").delete().eq("id", id);
    if (!error) {
      loadParticipants();
    }
  }

  function logout() {
    setIsAuth(false);
    localStorage.removeItem("admin_auth");
  }

  if (!isAuth) {
    return (
      <main className="max-w-sm mx-auto px-4 py-16">
        <h1 className="text-xl font-bold text-center mb-6">Адмін-панель</h1>
        <form onSubmit={handleLogin} className="bg-white rounded-2xl border p-6 shadow-sm">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            className="w-full bg-slate-800 text-white font-semibold py-3 rounded-xl"
          >
            Увійти
          </button>
          {error && <p className="text-red-600 text-sm text-center mt-3">{error}</p>}
        </form>
      </main>
    );
  }

  const totalParticipants = participants.length;
  const yesterdayDone = yesterdayCheckins.length;

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Адмін-панель</h1>
        <button onClick={logout} className="text-sm text-slate-500 underline">
          Вийти
        </button>
      </div>

      {cleanupMsg && (
        <div className="mb-4 text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
          {cleanupMsg}
        </div>
      )}

      {/* Учасники */}
      <section className="mb-8">
        <h2 className="font-semibold text-slate-800 mb-3">Учасники</h2>

        <form onSubmit={addParticipant} className="flex gap-2 mb-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ім'я учасника"
            className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            className="bg-green-600 text-white font-medium px-5 rounded-xl hover:bg-green-700"
          >
            Додати
          </button>
        </form>

        {loading ? (
          <p className="text-center text-slate-400">Завантаження...</p>
        ) : (
          <ul className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {participants.map((p) => (
              <li key={p.id} className="flex items-center justify-between px-4 py-3">
                <span className="font-medium">{p.name}</span>
                <button
                  onClick={() => removeParticipant(p.id)}
                  className="text-red-500 text-sm hover:underline"
                >
                  Видалити
                </button>
              </li>
            ))}
            {participants.length === 0 && (
              <li className="px-4 py-8 text-center text-slate-400">Поки немає учасників</li>
            )}
          </ul>
        )}
      </section>

      {/* Історія за вчора */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-800">
            Відмітки за вчора ({yesterdayNice})
          </h2>
          <div className="text-sm font-medium bg-slate-100 px-3 py-1 rounded-full">
            <span className="text-green-600">{yesterdayDone}</span>
            <span className="text-slate-400"> / </span>
            <span>{totalParticipants}</span>
          </div>
        </div>

        <ul className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {yesterdayCheckins.length === 0 ? (
            <li className="px-4 py-8 text-center text-slate-400">
              Вчора ніхто не відмічався
            </li>
          ) : (
            yesterdayCheckins.map((item, index) => (
              <li key={item.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm w-6">{index + 1}.</span>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-green-600 font-bold">✓</span>
                </div>
                <span className="text-sm text-slate-400">
                  {format(new Date(item.checked_at), "HH:mm")}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <div className="mt-8 text-center">
        <a href="/" className="text-green-600 underline text-sm">
          ← На головну
        </a>
      </div>
    </main>
  );
}
