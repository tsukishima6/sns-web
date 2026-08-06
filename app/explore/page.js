"use client";

import { useState, useEffect } from "react";
import {
  collectionGroup,
  query,
  where,
  orderBy,
  getDocs,
  collection,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

const fallbackPhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";

const fallbackKaiwai =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwai_admin.png?alt=media&token=a3a36f2a-d37f-49fb-a3a6-0914f24131a8";

export default function ExplorePage() {
  const [tab, setTab] = useState("user"); // "user" | "kaiwai"

  return (
    <div className="max-w-2xl mx-auto">
      {/* タブバー */}
      <div className="flex border-b border-gray-100 sticky top-14 bg-white z-10">
        {[
          { key: "user", label: "user" },
          { key: "kaiwai", label: "kaiwai" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{ fontFamily: "'Urbanist', sans-serif" }}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-[1.5px] ${
              tab === t.key
                ? "border-gray-800 text-gray-800"
                : "border-transparent text-gray-400"
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
      <div className="relative mb-5">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
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
          placeholder="名前またはIDで検索"
          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
          style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
        />
        {keyword && (
          <button
            onClick={() => setKeyword("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* 結果 */}
      {searching && (
        <p className="text-center text-sm text-gray-400 py-8">検索中...</p>
      )}

      {!searching && searched && results.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-8">
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
              <div className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-gray-50 transition-colors">
                <img
                  src={u.photo || fallbackPhoto}
                  alt={u.name}
                  className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate"
                     style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                    {u.name}
                  </p>
                  <p className="text-xs text-gray-400 truncate"
                     style={{ fontFamily: "'Urbanist', sans-serif" }}>
                    @{u.ID}
                  </p>
                </div>
                <svg className="ml-auto flex-shrink-0 text-gray-300" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!userDoc?.kaiwai ? (
        <p className="text-center text-sm text-gray-300 py-12"
           style={{ fontFamily: "'Urbanist', sans-serif" }}>
          界隈に参加するとユーザー検索が使えます
        </p>
      ) : (
        !keyword && (
          <p className="text-center text-sm text-gray-300 py-12"
             style={{ fontFamily: "'Urbanist', sans-serif" }}>
            キーワードを入力してください
          </p>
        )
      )}
    </div>
  );
}

/* ─── 界隈タブ ─── */
function KaiwaiTab() {
  const [kaiwaiList, setKaiwaiList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const snap = await getDocs(
          query(collection(db, "kaiwai"), orderBy("number", "desc"))
        );
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
      <p className="text-center text-sm text-gray-400 py-12">読み込み中...</p>
    );
  }

  const hobby = kaiwaiList.filter((k) => k.hobbies);
  const local = kaiwaiList.filter((k) => k.local);
  const alumni = kaiwaiList.filter((k) => k.alumni);
  const other = kaiwaiList.filter((k) => !k.hobbies && !k.local && !k.alumni);

  const sections = [
    { label: "趣味", list: hobby },
    { label: "地域", list: local },
    { label: "同窓・OB", list: alumni },
    { label: "その他", list: other },
  ].filter((s) => s.list.length > 0);

  return (
    <div className="px-4 py-4">
      {sections.map((section) => (
        <div key={section.label} className="mb-6">
          <h2
            className="text-xs font-semibold text-[#8fa8a7] uppercase tracking-widest mb-3 pb-1 border-b border-gray-100"
            style={{ fontFamily: "'Urbanist', sans-serif" }}
          >
            {section.label}
          </h2>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
            {section.list.map((k) => (
              <Link
                key={k.id}
                href={`/kaiwai/${k.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white hover:shadow-sm transition-shadow">
                  <div style={{ position: "relative", paddingTop: "56.25%" }}>
                    <img
                      src={k.image || fallbackKaiwai}
                      alt={k.name}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div className="p-2.5">
                    <p className="text-sm font-semibold text-gray-800 truncate"
                       style={{ fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif" }}>
                      {k.name}
                    </p>
                    <p className="text-xs text-[#8fa8a7] mt-0.5"
                       style={{ fontFamily: "'Urbanist', sans-serif" }}>
                      {k.number || 0}人
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
