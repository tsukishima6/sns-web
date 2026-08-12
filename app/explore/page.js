"use client";

import { useState, useEffect } from "react";
import {
  collectionGroup,
  query,
  where,
  getDocs,
  collection,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

const fallbackPhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";

export default function ExplorePage() {
  const [tab, setTab] = useState("user"); // "user" | "kaiwai"

  return (
    <div className="max-w-2xl mx-auto">
      {/* タブバー */}
      <div className="flex border-b border-gray-100 dark:border-[var(--border-subtle)] sticky top-14 bg-white dark:bg-[var(--surface)] z-10">
        {[
          { key: "user", label: "user" },
          { key: "kaiwai", label: "kaiwai" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{ fontFamily: "'Urbanist', sans-serif" }}
            className={`flex-1 py-3 text-lg font-medium transition-colors border-b-[1.5px] ${
              tab === t.key
                ? "border-gray-800 text-gray-800 dark:border-[var(--fg-primary)] dark:text-[var(--fg-primary)]"
                : "border-transparent text-gray-400 dark:text-[var(--fg-muted)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "user" && <UserSearchTab />}
      {tab === "kaiwai" && <KaiwaiTab />}
    </div>
  );
}

/* ─── ユーザー検索タブ ─── */
function UserSearchTab() {
  const { userDoc } = useAuth();
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!keyword.trim() || !userDoc?.kaiwai) {
      setResults([]);
      setSearched(false);
      return;
    }
    const timer = setTimeout(() => {
      doSearch(keyword.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [keyword, userDoc]);

  async function doSearch(q) {
    setSearching(true);
    setSearched(false);
    try {
      // name の前方一致検索（自分の界隈内のみ）
      const nameQuery = query(
        collectionGroup(db, "profile"),
        where("kaiwai", "==", userDoc.kaiwai),
        where("name", ">=", q),
        where("name", "<=", q + "\uf8ff"),
        limit(20)
      );
      // ID の前方一致検索（自分の界隈内のみ）
      const idQuery = query(
        collectionGroup(db, "profile"),
        where("kaiwai", "==", userDoc.kaiwai),
        where("ID", ">=", q),
        where("ID", "<=", q + "\uf8ff"),
        limit(10)
      );

      const [nameSnap, idSnap] = await Promise.all([
        getDocs(nameQuery),
        getDocs(idQuery),
      ]);

      const seen = new Set();
      const merged = [];

      for (const snap of [nameSnap, idSnap]) {
        for (const d of snap.docs) {
          const uid = d.ref.parent.parent?.id;
          const pid = d.id;
          const key = `${uid}/${pid}`;
          if (!seen.has(key) && uid) {
            seen.add(key);
            merged.push({ uid, pid, ...d.data() });
          }
        }
      }

      setResults(merged);
    } catch (e) {
      console.error("user search error:", e);
    } finally {
      setSearching(false);
      setSearched(true);
    }
  }

  return (
    <div className="px-4 py-4">
      {/* 検索バー */}
      <div className="relative mt-3 mb-5">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-[var(--fg-muted)]"
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="22" y2="22" />
        </svg>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full h-9 pl-9 pr-4 bg-gray-50 dark:bg-[var(--surface-muted)] border border-gray-100 dark:border-[var(--border-subtle)] rounded-full text-sm text-[var(--fg-primary)] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
        />
        {keyword && (
          <button
            onClick={() => setKeyword("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 dark:text-[var(--fg-muted)] dark:hover:text-[var(--fg-primary)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* 結果 */}
      {searching && (
        <p className="text-center text-sm text-gray-400 dark:text-[var(--fg-muted)] py-8">検索中...</p>
      )}

      {!searching && searched && results.length === 0 && (
        <p className="text-center text-sm text-gray-400 dark:text-[var(--fg-muted)] py-8">
          「{keyword}」に一致するユーザーが見つかりませんでした
        </p>
      )}

      {!searching && results.length > 0 && (
        <div className="space-y-1">
          {results.map((u) => (
            <Link
              key={`${u.uid}/${u.pid}`}
              href={`/users/${u.uid}/profile/${u.pid}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)] transition-colors">
                <img
                  src={u.photo || fallbackPhoto}
                  alt={u.name}
                  className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-[var(--fg-primary)] truncate"
                     style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                    {u.name}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-[var(--fg-muted)] truncate"
                     style={{ fontFamily: "'Urbanist', sans-serif" }}>
                    @{u.ID}
                  </p>
                </div>
                <svg className="ml-auto flex-shrink-0 text-gray-300 dark:text-[var(--fg-muted)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!userDoc?.kaiwai ? (
        <p className="text-center text-base text-gray-300 dark:text-[var(--fg-muted)] py-12"
           style={{ fontFamily: "'Urbanist', sans-serif" }}>
          界隈に参加するとユーザー検索が使えます
        </p>
      ) : (
        !keyword && (
          <p className="text-center text-base text-gray-300 dark:text-[var(--fg-muted)] py-12"
             style={{ fontFamily: "'Urbanist', sans-serif" }}>
            キーワードを入力してください
          </p>
        )
      )}
    </div>
  );
}

/* ─── 界隈タブ ─── */
const KAIWAI_CATEGORIES = [
  { key: "hobbies", label: "趣味" },
  { key: "local", label: "地域" },
  { key: "alumni", label: "同窓・OB" },
  { key: "other", label: "その他" },
];

function sortByName(list) {
  return [...list].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", "ja")
  );
}
function sortByNumberAsc(list) {
  return [...list].sort((a, b) => (a.number || 0) - (b.number || 0));
}
function sortByNumberDesc(list) {
  return [...list].sort((a, b) => (b.number || 0) - (a.number || 0));
}

function KaiwaiTab() {
  const [kaiwaiList, setKaiwaiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    async function fetch() {
      try {
        // orderBy("number") だと number フィールドが無いドキュメント（ユーザー作成のkaiwaiなど）が
        // Firestoreの仕様上クエリ結果から丸ごと除外されてしまうため、探索用の一覧では使わない
        const snap = await getDocs(collection(db, "kaiwai"));
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((k) => !k.closed && !k.noindex);
        setKaiwaiList(list);
      } catch (e) {
        console.error("kaiwai fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  if (loading) {
    return (
      <p className="text-center text-base text-gray-400 dark:text-[var(--fg-muted)] py-12">読み込み中...</p>
    );
  }

  // 子kaiwai（parentが設定されているもの）は一覧に出さず、親のアコーディオン内にのみ表示する
  const categories = KAIWAI_CATEGORIES.map((c) => {
    const base = kaiwaiList.filter((k) => {
      if (k.parent) return false;
      if (c.key === "other") return !k.hobbies && !k.local && !k.alumni;
      return !!k[c.key];
    });
    // 地域・その他は人数順（地域は少ない順、その他は多い順）、それ以外は名前順
    let list;
    if (c.key === "local") list = sortByNumberAsc(base);
    else if (c.key === "other") list = sortByNumberDesc(base);
    else list = sortByName(base);
    return { ...c, list };
  }).filter((c) => c.list.length > 0);

  const effectiveCategory =
    activeCategory && categories.some((c) => c.key === activeCategory)
      ? activeCategory
      : categories[0]?.key;

  const currentList =
    categories.find((c) => c.key === effectiveCategory)?.list || [];

  const trimmedKeyword = keyword.trim().toLowerCase();
  const searchResults = trimmedKeyword
    ? kaiwaiList.filter(
        (k) =>
          (k.name || "").toLowerCase().includes(trimmedKeyword) ||
          (k.name_english || "").toLowerCase().includes(trimmedKeyword)
      )
    : [];

  return (
    <div className="px-4 py-4">
      {/* 検索バー */}
      <div className="relative mt-3 mb-5">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 dark:text-[var(--fg-muted)]"
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="22" y2="22" />
        </svg>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-full h-9 pl-9 pr-4 bg-gray-50 dark:bg-[var(--surface-muted)] border border-gray-100 dark:border-[var(--border-subtle)] rounded-full text-sm text-[var(--fg-primary)] focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
        />
        {keyword && (
          <button
            onClick={() => setKeyword("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 dark:text-[var(--fg-muted)] dark:hover:text-[var(--fg-primary)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {trimmedKeyword ? (
        searchResults.length > 0 ? (
          <div className="space-y-1">
            {searchResults.map((k) => (
              <KaiwaiRow key={k.id} k={k} allKaiwai={kaiwaiList} />
            ))}
          </div>
        ) : (
          <p className="text-center text-base text-gray-400 dark:text-[var(--fg-muted)] py-12">
            「{keyword.trim()}」に一致する界隈が見つかりませんでした
          </p>
        )
      ) : categories.length === 0 ? (
        <p className="text-center text-base text-gray-400 dark:text-[var(--fg-muted)] py-12">
          界隈が見つかりませんでした
        </p>
      ) : (
        <>
          {/* カテゴリタブ */}
          <div className="flex justify-center gap-4 mb-5 overflow-x-auto no-scrollbar">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setActiveCategory(c.key)}
                style={{
                  fontFamily: "'Urbanist', sans-serif",
                  background:
                    effectiveCategory === c.key
                      ? "linear-gradient(135deg, #152635, #8fa8a7)"
                      : undefined,
                }}
                className={`flex-shrink-0 h-9 px-4 flex items-center justify-center rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  effectiveCategory === c.key
                    ? "text-white"
                    : "bg-gray-100 dark:bg-[var(--surface-muted)] text-gray-500 dark:text-[var(--fg-muted)]"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            {currentList.map((k) => (
              <KaiwaiRow key={k.id} k={k} allKaiwai={kaiwaiList} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* 界隈1件分の行。oya（親）はアコーディオンでサブ界隈を開閉できる */
function KaiwaiRow({ k, allKaiwai, depth = 0 }) {
  const [open, setOpen] = useState(false);
  const isOya = k.oya === true;
  const children = isOya
    ? allKaiwai.filter((c) => c.parent?.id === k.id)
    : [];

  return (
    <div>
      <div className="flex items-center">
        <Link
          href={`/kaiwai/${k.id}`}
          style={{ textDecoration: "none", color: "inherit", paddingLeft: `${depth * 1.2}rem` }}
          className="flex-1 min-w-0 flex flex-col py-3 px-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)] transition-colors"
        >
          <span
            className="text-base font-semibold text-gray-800 dark:text-[var(--fg-primary)] truncate"
            style={{ fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif" }}
          >
            {k.name}
          </span>
          {k.name_english && (
            <span
              className="text-sm text-[#8fa8a7] truncate"
              style={{ fontFamily: "'Urbanist', sans-serif" }}
            >
              {k.name_english}
            </span>
          )}
        </Link>

        {isOya && (
          <span
            className="flex-shrink-0 text-xs text-gray-400 dark:text-[var(--fg-muted)] whitespace-nowrap"
            style={{ fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif" }}
          >
            サブkaiwaiがあります
          </span>
        )}

        {isOya && (
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "サブ界隈を閉じる" : "サブ界隈を開く"}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:text-[var(--fg-muted)] dark:hover:text-[var(--fg-primary)] transition-colors"
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        )}
      </div>

      {isOya && open && children.length > 0 && (
        <div className="ml-4 border-l border-gray-100 dark:border-[var(--border-subtle)]">
          {children.map((c) => (
            <KaiwaiRow key={c.id} k={c} allKaiwai={allKaiwai} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
