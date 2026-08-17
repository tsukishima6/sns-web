"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// kaiwai作成・編集フォームで共用するUI部品(元はapp/kaiwai/new/page.jsにのみ
// あったものを、編集ページ新設に伴い共有化した)

export const fallbackKaiwaiImage =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwai_admin.png?alt=media&token=a3a36f2a-d37f-49fb-a3a6-0914f24131a8";

export function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-black" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function ToggleRow({ label, sublabel, checked, onChange, helper }) {
  return (
    <div className="py-3 border-b border-gray-100 dark:border-[var(--border-subtle)] last:border-b-0">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-800 dark:text-[var(--fg-primary)]">{label}</p>
          <p className="text-xs text-gray-400 dark:text-[var(--fg-muted)]">{sublabel}</p>
        </div>
        <Toggle checked={checked} onChange={onChange} />
      </div>
      {helper && <p className="text-xs text-gray-400 dark:text-[var(--fg-muted)] mt-1.5">{helper}</p>}
    </div>
  );
}

export function ParentSelectModal({ onClose, onSelect }) {
  const [search, setSearch] = useState("");
  const [list, setList] = useState(null);
  const [pending, setPending] = useState(null);

  useEffect(() => {
    getDocs(collection(db, "kaiwai")).then((snap) => {
      setList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  const filtered = (list || []).filter((k) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (k.name || "").toLowerCase().includes(q) ||
      (k.name_english || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/50 px-0 sm:px-4">
      <div className="w-full sm:max-w-md bg-white dark:bg-[var(--surface)] rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[var(--border-subtle)]">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-[var(--fg-primary)]">親KAIWAIを選択</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 dark:text-[var(--fg-muted)] hover:text-gray-700 dark:hover:text-[var(--fg-secondary)] text-lg leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-4 py-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="検索"
            className="w-full px-3 py-2 border border-gray-200 dark:border-[var(--border-subtle)] dark:bg-[var(--surface)] dark:text-[var(--fg-primary)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {list === null ? (
            <p className="text-sm text-gray-400 dark:text-[var(--fg-muted)] text-center py-8">読み込み中...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-[var(--fg-muted)] text-center py-8">見つかりませんでした</p>
          ) : (
            filtered.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setPending(k)}
                className="relative w-full h-12 rounded-full overflow-hidden text-left shrink-0"
                style={{
                  backgroundImage: `url(${k.image || fallbackKaiwaiImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <span
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to bottom right, rgba(0,0,0,0.3), rgba(0,0,0,0.64))",
                  }}
                />
                <span className="absolute inset-0 flex items-center px-5">
                  <span className="text-sm text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                    {k.name}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>

        {pending && (
          <div className="border-t border-gray-100 dark:border-[var(--border-subtle)] p-4 space-y-3">
            <p className="text-sm text-gray-700 dark:text-[var(--fg-secondary)] text-center">
              「{pending.name}」を親KAIWAIに設定しますか？
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="flex-1 py-2 rounded-lg text-sm border border-gray-200 dark:border-[var(--border-subtle)] text-gray-600 dark:text-[var(--fg-secondary)] hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)]"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => onSelect(pending)}
                className="flex-1 py-2 rounded-lg text-sm bg-black text-white hover:bg-gray-800"
              >
                設定する
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
