"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { useSignupPrompt } from "@/lib/SignupPromptContext";
import { ToggleRow, ParentSelectModal } from "@/app/components/KaiwaiFormControls";

// ネイティブ(kaiwai_edit_widget.dart)が編集対象にしているのはname/name_english/
// closed/noindex/parentのみ(hobbies/local/other等の分類は作成後変更不可)。
// 編集権限のチェックはFirestoreルール(isKaiwaiEditByCreator())と厳密に一致させる必要がある:
// ルールは「呼び出し元のusers.nowprofile自体がこの界隈のmaster:trueプロフィールか」を
// 見ており、他のprofileにmaster:trueがあっても対象外(=横断検索ではない)。
export default function EditKaiwaiPage({ params }) {
  const { kaiwaiID } = params;
  const { user, userDoc, loading: authLoading } = useAuth();
  const { openSignupPrompt } = useSignupPrompt();
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [kaiwaiRef] = useState(() => doc(db, "kaiwai", kaiwaiID));

  const [name, setName] = useState("");
  const [kaiwaiIDField, setKaiwaiIDField] = useState("");
  const [closed, setClosed] = useState(false);
  const [noindex, setNoindex] = useState(false);
  const [parent, setParent] = useState(null); // {id, name, ref}
  const [showParentModal, setShowParentModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      openSignupPrompt();
      router.push("/");
      return;
    }
    if (!userDoc?.nowprofile) {
      setAuthorized(false);
      setChecking(false);
      return;
    }
    (async () => {
      try {
        const profSnap = await getDoc(userDoc.nowprofile);
        const prof = profSnap.exists() ? profSnap.data() : null;
        const isMaster = prof?.master === true && prof?.kaiwai?.id === kaiwaiID;
        if (!isMaster) {
          setAuthorized(false);
          setChecking(false);
          return;
        }
        setAuthorized(true);

        const kaiwaiSnap = await getDoc(kaiwaiRef);
        if (kaiwaiSnap.exists()) {
          const k = kaiwaiSnap.data();
          setName(k.name || "");
          setKaiwaiIDField(k.name_english || "");
          setClosed(k.closed === true);
          setNoindex(k.noindex === true);
          if (k.parent) {
            const parentSnap = await getDoc(k.parent);
            if (parentSnap.exists()) {
              setParent({ id: parentSnap.id, name: parentSnap.data().name, ref: k.parent });
            }
          }
        }
      } catch (e) {
        console.error("kaiwai edit init error:", e);
      } finally {
        setChecking(false);
      }
    })();
  }, [user, authLoading, userDoc?.nowprofile, kaiwaiID]);

  function handleIDChange(e) {
    setKaiwaiIDField(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12));
  }

  const canSubmit = name.trim() !== "" && kaiwaiIDField.trim() !== "";

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setConfirming(true);
  }

  async function handleSave() {
    setSubmitting(true);
    setError("");
    try {
      await updateDoc(kaiwaiRef, {
        name: name.trim(),
        name_english: kaiwaiIDField.trim(),
        closed,
        noindex,
        parent: parent?.ref || null,
      });
      if (parent?.ref) {
        await updateDoc(parent.ref, { oya: true });
      }
      router.push(`/kaiwai/${kaiwaiID}`);
    } catch (e) {
      console.error("kaiwai edit save error:", e);
      setError("保存に失敗しました");
      setSubmitting(false);
      setConfirming(false);
    }
  }

  if (authLoading || checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 dark:text-[var(--fg-muted)] text-sm">読み込み中...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-[var(--fg-secondary)] text-sm">
          この界隈を編集する権限がありません。
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-lg font-semibold text-gray-800 dark:text-[var(--fg-primary)] mb-6">KAIWAIを編集</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-[var(--fg-primary)] mb-1">KAIWAI名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 12))}
            maxLength={12}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--border-subtle)] dark:bg-[var(--surface)] dark:text-[var(--fg-primary)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <p className="text-right text-xs text-gray-400 dark:text-[var(--fg-muted)] mt-1">{name.length}/12</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-[var(--fg-primary)] mb-1">KAIWAI ID</label>
          <input
            type="text"
            value={kaiwaiIDField}
            onChange={handleIDChange}
            maxLength={12}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--border-subtle)] dark:bg-[var(--surface)] dark:text-[var(--fg-primary)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <p className="text-xs text-gray-400 dark:text-[var(--fg-muted)] mt-1">半角英数字のみ、12文字まで</p>
        </div>

        <div className="bg-gray-50 dark:bg-[var(--surface-muted)] rounded-xl px-3">
          <ToggleRow
            label="クローズド"
            sublabel="closed"
            checked={closed}
            onChange={setClosed}
            helper="KAIWAI IDで検索したユーザーのみが参加できます。"
          />
          <ToggleRow
            label="WEB検索に表示しない"
            sublabel="noindex"
            checked={noindex}
            onChange={setNoindex}
            helper="WEBでの検索結果には表示されないよう設定します。"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-[var(--fg-primary)]">既存KAIWAIの子として設定</p>
            {parent ? (
              <p className="text-xs text-gray-500 dark:text-[var(--fg-secondary)] mt-0.5">{parent.name}</p>
            ) : (
              <p className="text-xs text-gray-400 dark:text-[var(--fg-muted)] mt-0.5">未設定　*必須ではありません</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowParentModal(true)}
            className="px-4 py-1.5 rounded-full text-xs border border-gray-300 dark:border-[var(--border-subtle)] text-gray-600 dark:text-[var(--fg-secondary)] hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)]"
          >
            親を選択
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>
        )}

        {!confirming ? (
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40 transition-colors"
          >
            編集を保存
          </button>
        ) : (
          <div className="border border-gray-200 dark:border-[var(--border-subtle)] rounded-xl p-4 space-y-3">
            <p className="text-sm text-gray-700 dark:text-[var(--fg-secondary)] text-center">変更を保存します</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={submitting}
                className="flex-1 py-2 rounded-lg text-sm border border-gray-200 dark:border-[var(--border-subtle)] text-gray-600 dark:text-[var(--fg-secondary)] hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)] disabled:opacity-40"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={submitting}
                className="flex-1 py-2 rounded-lg text-sm bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {submitting ? "保存中..." : "OK"}
              </button>
            </div>
          </div>
        )}
      </form>

      {showParentModal && (
        <ParentSelectModal
          onClose={() => setShowParentModal(false)}
          onSelect={(k) => {
            setParent({ id: k.id, name: k.name, ref: doc(db, "kaiwai", k.id) });
            setShowParentModal(false);
          }}
        />
      )}
    </div>
  );
}
