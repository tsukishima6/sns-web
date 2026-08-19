"use client";

import { useState } from "react";
import Link from "next/link";
import { doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { findExistingProfile, switchMainKaiwai, joinKaiwai } from "@/lib/kaiwaiJoin";

// ネイティブ(ffcode/lib/subkaiwai/kaiwai_items/kaiwai_items_widget.dartの
// カードタップ)と同じく、一覧からKAIWAIを「選ぶ」操作自体に参加確認ダイアログを
// 持たせる。ログイン中はタップ→「○○KAIWAIに参加しますか？」→OKで参加(または
// 既に参加済みならメイン切替)まで済ませてから/kaiwai/[id]へ遷移する。
// 未ログイン時は参加できないため通常のLink遷移のみ(KaiwaiJoinButtonのnull
// ガードと同じ判断)。
export default function KaiwaiSelectLink({ kaiwaiId, kaiwaiName, className, style, children }) {
  const { user, userDoc } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  function handleClick(e) {
    if (!user) return;
    e.preventDefault();
    setConfirming(true);
  }

  async function handleConfirm() {
    if (pending) return;
    setPending(true);
    try {
      const kaiwaiRef = doc(db, "kaiwai", kaiwaiId);
      const isMember = (userDoc?.kaiwai_list || []).some((r) => r.id === kaiwaiId);
      if (isMember) {
        const found = await findExistingProfile(user.uid, kaiwaiRef);
        if (found?.ref) {
          await switchMainKaiwai(user.uid, kaiwaiRef, found.ref);
        }
      } else {
        await joinKaiwai({ uid: user.uid, userDoc, kaiwaiRef, kaiwaiName });
      }
    } catch (err) {
      console.error("kaiwai select join error:", err);
    } finally {
      // AuthContextのuserDocはFirestoreの変更を購読していないため、
      // フィード/フッター等に確実に反映させるためフルリロードで遷移する
      window.location.href = `/kaiwai/${kaiwaiId}`;
    }
  }

  return (
    <>
      <Link href={`/kaiwai/${kaiwaiId}`} onClick={handleClick} className={className} style={style}>
        {children}
      </Link>

      {confirming && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={() => !pending && setConfirming(false)}
        >
          <div
            className="w-full max-w-xs bg-white dark:bg-[var(--surface)] rounded-[28px] shadow-2xl p-6 space-y-5 animate-[dialog-in_0.18s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium text-gray-700 dark:text-[var(--fg-secondary)] text-center leading-relaxed">
              {kaiwaiName}KAIWAIに
              <br />
              参加しますか？
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={pending}
                className="flex-1 py-2.5 rounded-full text-sm font-medium border border-gray-200 dark:border-[var(--border-subtle)] text-gray-600 dark:text-[var(--fg-secondary)] hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)] transition-colors disabled:opacity-40"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white shadow-md hover:brightness-110 active:scale-[0.97] transition disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #152635, #8fa8a7)" }}
              >
                {pending ? "処理中..." : "参加する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
