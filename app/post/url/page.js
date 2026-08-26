"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { useSignupPrompt } from "@/lib/SignupPromptContext";
import Link from "next/link";

export default function PostUrlPage() {
  const { user, userDoc, loading } = useAuth();
  const { openSignupPrompt } = useSignupPrompt();
  const router = useRouter();

  const [step, setStep] = useState("url"); // "url" | "preview" | "kaiwai"
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [ogp, setOgp] = useState(null);
  const [ogpError, setOgpError] = useState("");
  const [kaiwaiList, setKaiwaiList] = useState([]);
  const [selectedKaiwai, setSelectedKaiwai] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      openSignupPrompt();
      router.push("/");
    }
  }, [user, loading]);

  useEffect(() => {
    if (!user || !userDoc) return;
    loadKaiwaiList();
  }, [user, userDoc]);

  async function loadKaiwaiList() {
    const kaiwaiRefs = userDoc?.kaiwai_list || [];
    try {
      const items = await Promise.all(
        kaiwaiRefs.map(async (ref) => {
          const snap = await getDoc(ref);
          return snap.exists() ? { id: snap.id, ...snap.data() } : null;
        })
      );
      setKaiwaiList(items.filter(Boolean));
    } catch (e) {
      console.error("kaiwai list error:", e);
    }
  }

  async function handleFetchOgp() {
    if (!url.trim()) return;
    setFetching(true);
    setOgpError("");
    setOgp(null);
    try {
      const res = await fetch(`/api/ogp?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOgp(data);
      setTitle(data.title || "");
      setDescription(data.description || "");
      setStep("preview");
    } catch (e) {
      setOgpError("URLの情報を取得できませんでした。URLを確認してください。");
    } finally {
      setFetching(false);
    }
  }

  async function handleSubmit() {
    if (!selectedKaiwai) return;
    setSubmitting(true);
    try {
      const kaiwaiRef = doc(db, "kaiwai", selectedKaiwai.id);
      await addDoc(collection(db, "kaiwai", selectedKaiwai.id, "news"), {
        title: title.trim(),
        description: description.trim(),
        img: ogp?.image || "",
        url: ogp?.url || url.trim(),
        sitename: ogp?.sitename || "",
        time: serverTimestamp(),
        picker: userDoc?.nowprofile || null,
        kaiwai: kaiwaiRef,
        source: "user",
        // 人が選んで投稿した記事は自動取得の「タイトル一致」相当以上に関連性が高いとみなす。
        // scoreを持たないドキュメントはkaiwai詳細ページのorderBy("score","desc")から
        // 除外されてしまう(Firestoreの仕様)ため、必ず設定する
        relevanceScore: 50,
        popularityScore: 0,
        recencyScore: 10,
        sourceCount: 1,
        score: 60,
      });
      router.push(`/kaiwai/${selectedKaiwai.id}`);
    } catch (e) {
      console.error("submit error:", e);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 dark:text-[var(--fg-muted)] text-sm">読み込み中...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        {step === "url" ? (
          <Link href="/post/new" className="text-gray-400 dark:text-[var(--fg-muted)] hover:text-gray-600 dark:hover:text-[var(--fg-secondary)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
        ) : (
          <button onClick={() => setStep(step === "kaiwai" ? "preview" : "url")} className="text-gray-400 dark:text-[var(--fg-muted)] hover:text-gray-600 dark:hover:text-[var(--fg-secondary)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <h1 className="text-base font-semibold text-gray-800 dark:text-[var(--fg-primary)]">URLを投稿する</h1>
      </div>

      {/* ステップ1: URL入力 */}
      {step === "url" && (
        <div className="space-y-5">
          <p className="text-sm text-gray-500 dark:text-[var(--fg-secondary)]">
            シェアしたいWebページのURLを入力してください。
            OGP情報を取得して界隈のニュースとして投稿できます。
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--fg-primary)] mb-1">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFetchOgp()}
              placeholder="https://..."
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-[var(--border-subtle)] dark:bg-[var(--surface)] dark:text-[var(--fg-primary)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {ogpError && (
            <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{ogpError}</p>
          )}

          <button
            onClick={handleFetchOgp}
            disabled={!url.trim() || fetching}
            className="w-full py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {fetching ? "取得中..." : "URLの情報を取得"}
          </button>
        </div>
      )}

      {/* ステップ2: プレビュー・編集 */}
      {step === "preview" && ogp && (
        <div className="space-y-5">
          {/* OGPプレビュー */}
          <div className="border border-gray-200 dark:border-[var(--border-subtle)] rounded-2xl overflow-hidden">
            {ogp.image && (
              <img src={ogp.image} alt="" className="w-full h-44 object-cover" />
            )}
            <div className="p-4">
              <p className="text-xs text-[#8fa8a7] mb-1"
                 style={{ fontFamily: "'Urbanist', sans-serif" }}>
                {ogp.sitename}
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-[var(--fg-primary)] line-clamp-2"
                 style={{ fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif" }}>
                {ogp.title}
              </p>
            </div>
          </div>

          {/* タイトル編集 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--fg-primary)] mb-1">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--border-subtle)] dark:bg-[var(--surface)] dark:text-[var(--fg-primary)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* 説明編集 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--fg-primary)] mb-1">説明（任意）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--border-subtle)] dark:bg-[var(--surface)] dark:text-[var(--fg-primary)] rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <button
            onClick={() => setStep("kaiwai")}
            className="w-full py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            界隈を選ぶ
          </button>
        </div>
      )}

      {/* ステップ3: 界隈選択 */}
      {step === "kaiwai" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-[var(--fg-secondary)]">投稿する界隈を選んでください</p>

          {kaiwaiList.length === 0 ? (
            <p className="text-center text-sm text-gray-400 dark:text-[var(--fg-muted)] py-8">
              参加している界隈がありません
            </p>
          ) : (
            <div className="space-y-2">
              {kaiwaiList.map((k) => (
                <button
                  key={k.id}
                  onClick={() => setSelectedKaiwai(k)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    selectedKaiwai?.id === k.id
                      ? "border-black dark:border-white bg-gray-50 dark:bg-[var(--surface-muted)]"
                      : "border-gray-200 dark:border-[var(--border-subtle)] hover:border-gray-300 dark:hover:border-[var(--fg-muted)]"
                  }`}
                >
                  {k.image && (
                    <img src={k.image} alt={k.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium text-gray-800 dark:text-[var(--fg-primary)]"
                        style={{ fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif" }}>
                    {k.name}
                  </span>
                  {selectedKaiwai?.id === k.id && (
                    <svg className="ml-auto flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!selectedKaiwai || submitting}
            className="w-full py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {submitting ? "投稿中..." : "投稿する"}
          </button>
        </div>
      )}
    </div>
  );
}
