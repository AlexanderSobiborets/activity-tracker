"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { supabase, Participant, Checkin } from "@/lib/supabase";
import { getLogicalDate } from "@/lib/date-utils";

type StatusItem = {
  id: string;
  name: string;
  done: boolean;
  checkedAt: string | null;
};

export default function HomePage() {
  const [items, setItems] = useState<StatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const today = getLogicalDate(); // день починається о 03:00
  const todayNice = format(new Date(), "d MMMM yyyy", { locale: uk });

  async function loadData() {
    setLoading(true);
    try {
      const { data: participants, error: pError } = await supabase
        .from("participants")
        .select("*")
        .order("name");

      if (pError) throw pError;

      const { data: checkins, error: cError } = await supabase
        .from("checkins")
        .select("*")
        .eq("check_date", today);

      if (cError) throw cError;

      const checkinMap = new Map<string, Checkin>();
      (checkins || []).forEach((c) => checkinMap.set(c.participant_id, c));

      const status: StatusItem[] = (participants || []).map((p: Participant) => {
        const checkin = checkinMap.get(p.id);
        return {
          id: p.id,
          name: p.name,
          done: !!checkin,
          checkedAt: checkin ? checkin.checked_at : null,
        };
      });

      setItems(status);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: "Помилка завантаження даних" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleCheckin() {
    if (!selectedId) {
      setMessage({ type: "error", text: "Оберіть своє ім'я" });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const { data: existing } = await supabase
        .from("checkins")
        .select("id")
        .eq("participant_id", selectedId)
        .eq("check_date", today)
        .maybeSingle();

      if (existing) {
        setMessage({ type: "error", text: "Ви вже відмітилися сьогодні 👍" });
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from("checkins").insert({
        participant_id: selectedId,
        check_date: today,
        checked_at: new Date().toISOString(),
      });

      if (error) throw error;

      setMessage({ type: "success", text: "Успішно відмічено! Дякую 🔥" });
      setSelectedId("");
      await loadData();
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: "Не вдалося відмітити. Спробуй ще раз." });
    } finally {
      setSubmitting(false);
    }
  }

  const doneCount = items.filter((i) => i.done).length;
  const total = items.length;

  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Чат Активу</h1>
        <p className="text-slate-500 mt-1">{todayNice}</p>
        <div className="mt-3 inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 text-sm font-medium shadow-sm">
          <span className="text-green-600">{doneCount}</span>
          <span className="text-slate-400">/</span>
          <span>{total}</span>
          <span className="text-slate-500">виконали</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
        <h2 className="font-semibold text-slate-800 mb-3">Відмітитися за сьогодні</h2>

        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">Обери своє ім'я...</option>
          {items.map((item) => (
            <option key={item.id} value={item.id} disabled={item.done}>
              {item.name} {item.done ? "✓" : ""}
            </option>
          ))}
        </select>

        <button
          onClick={handleCheckin}
          disabled={submitting || !selectedId}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white font-semibold py-3.5 rounded-xl transition-colors text-base"
        >
          {submitting ? "Зберігаю..." : "Виконав актив на сьогодні ✓"}
        </button>

        {message && (
          <div
            className={`mt-4 text-center text-sm font-medium rounded-lg py-2 px-3 ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <h2 className="font-semibold text-slate-800">Статус на сьогодні</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Завантаження...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Учасників ще немає.
            <br />
            <a href="/admin" className="text-green-600 underline text-sm">
              Додати в адмінці
            </a>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      item.done
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {item.done ? "✓" : "–"}
                  </div>
                  <span className={`font-medium ${item.done ? "text-slate-800" : "text-slate-500"}`}>
                    {item.name}
                  </span>
                </div>
                <div className="text-sm text-slate-400">
                  {item.done && item.checkedAt
                    ? format(new Date(item.checkedAt), "HH:mm")
                    : "—"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-center text-xs text-slate-400 mt-8">
        Адмін-панель:{" "}
        <a href="/admin" className="underline hover:text-slate-600">
          /admin
        </a>
      </p>
    </main>
  );
}
