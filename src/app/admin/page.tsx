"use client";

import { useEffect, useState } from "react";
import { supabase, Participant } from "@/lib/supabase";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuth, setIsAuth] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Simple client-side password check (for basic protection)
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

  useEffect(() => {
    const saved = localStorage.getItem("admin_auth");
    if (saved === "true") {
      setIsAuth(true);
      loadParticipants();
    }
  }, []);

  async function loadParticipants() {
    setLoading(true);
    const { data, error } = await supabase
      .from("participants")
      .select("*")
      .order("name");

    if (error) {
      setError("Помилка завантаження");
    } else {
      setParticipants(data || []);
    }
    setLoading(false);
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuth(true);
      localStorage.setItem("admin_auth", "true");
      loadParticipants();
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
        <p className="text-center text-xs text-slate-400 mt-6">
          Пароль за замовчуванням: admin123<br />
          (зміни через NEXT_PUBLIC_ADMIN_PASSWORD)
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Учасники</h1>
        <button onClick={logout} className="text-sm text-slate-500 underline">
          Вийти
        </button>
      </div>

      <form onSubmit={addParticipant} className="flex gap-2 mb-6">
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

      <div className="mt-8 text-center">
        <a href="/" className="text-green-600 underline text-sm">
          ← На головну
        </a>
      </div>
    </main>
  );
}
