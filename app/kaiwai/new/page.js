"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

const fallbackImage =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwai_admin.png?alt=media&token=a3a36f2a-d37f-49fb-a3a6-0914f24131a8";

function Toggle({ checked, onChange }) {
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

function ToggleRow({ label, sublabel, checked, onChange, helper }) {
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

function ParentSelectModal({ onClose, onSelect }) {
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
                  backgroundImage: `url(${k.image || fallbackImage})`,
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

export default function NewKaiwaiPage() {
  const { user, userDoc, loading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [kaiwaiID, setKaiwaiID] = useState("");
  const [hobbies, setHobbies] = useState(false);
  const [local, setLocal] = useState(false);
  const [other, setOther] = useState(false);
  const [closed, setClosed] = useState(false);
  const [noindex, setNoindex] = useState(false);
  const [parent, setParent] = useState(null); // {id, name, ref}
  const [showParentModal, setShowParentModal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
    }
  }, [user, loading]);

  function handleIDChange(e) {
    const filtered = e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12);
    setKaiwaiID(filtered);
  }

  const canSubmit =
    name.trim() !== "" && kaiwaiID.trim() !== "" && (hobbies || local || other);

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setConfirming(true);
  }

  async function handleCreate() {
    setSubmitting(true);
    setError("");

    try {
      const userRef = doc(db, "users", user.uid);

      // 現在のプロフィールのIDを引き継ぐ
      const currentProfileRef =
        userDoc?.nowprofile || doc(db, "users", user.uid, "profile", user.uid);
      const currentProfileSnap = await getDoc(currentProfileRef);
      const currentProfileID = currentProfileSnap.exists()
        ? currentProfileSnap.data().ID || ""
        : "";

      // 1. 界隈を作成
      const kaiwaiRef = doc(collection(db, "kaiwai"));
      await setDoc(kaiwaiRef, {
        name: name.trim(),
        name_english: kaiwaiID.trim(),
        hobbies,
        local,
        other,
        closed,
        noindex,
        parent: parent?.ref || null,
        users: [userRef],
      });

      // 2. この界隈専用の新規プロフィールを作成
      const profileRef = doc(collection(db, "users", user.uid, "profile"));
      await setDoc(profileRef, {
        name: userDoc?.display_name || "",
        ID: currentProfileID,
        photo: userDoc?.photo_url || "",
        bio: "",
        kaiwai: kaiwaiRef,
        master: true,
        created_time: serverTimestamp(),
      });

      // 3. ユーザーのアクティブ界隈・プロフィールを切り替え
      await updateDoc(userRef, {
        kaiwai: kaiwaiRef,
        nowprofile: profileRef,
        kaiwai_list: arrayUnion(kaiwaiRef),
      });

      // 4. 親を選択していれば親側にoyaフラグを立てる
      if (parent?.ref) {
        await updateDoc(parent.ref, { oya: true });
      }

      // 5. 開始投稿
      await addDoc(collection(db, "users", user.uid, "posts"), {
        postDescription: `${name.trim()}KAIWAIを立ち上げました！よろしくお願いします。`,
        postPhoto: "",
        postphoto2: "",
        postphoto3: "",
        postUser: userRef,
        postUser_profile: profileRef,
        kaiwai: kaiwaiRef,
        timePosted: serverTimestamp(),
        numlikes: 0,
        amount_comment: 0,
        postOwner: true,
        users_liked: [],
        users_favorited: [],
        hashtags: [],
      });

      router.push(`/kaiwai/${kaiwaiRef.id}`);
    } catch (err) {
      console.error("kaiwai create error:", err);
      setError("KAIWAIの作成に失敗しました。もう一度お試しください。");
      setConfirming(false);
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-base font-semibold text-gray-800 dark:text-[var(--fg-primary)]">KAIWAIを立ち上げる</h1>
        <Link href="/kaiwai" className="text-sm text-gray-400 dark:text-[var(--fg-muted)] hover:text-gray-600 dark:hover:text-[var(--fg-secondary)]">
          キャンセル
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* KAIWAI名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-[var(--fg-primary)] mb-1">KAIWAI名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 12))}
            maxLength={12}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--border-subtle)] dark:bg-[var(--surface)] dark:text-[var(--fg-primary)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="例: 読書"
          />
          <p className="text-right text-xs text-gray-400 dark:text-[var(--fg-muted)] mt-1">{name.length}/12</p>
        </div>

        {/* KAIWAI ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-[var(--fg-primary)] mb-1">KAIWAI ID</label>
          <input
            type="text"
            value={kaiwaiID}
            onChange={handleIDChange}
            maxLength={12}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--border-subtle)] dark:bg-[var(--surface)] dark:text-[var(--fg-primary)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="dokusho"
          />
          <p className="text-xs text-gray-400 dark:text-[var(--fg-muted)] mt-1">半角英数字のみ、12文字まで</p>
        </div>

        {/* カテゴリ */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-[var(--fg-primary)] mb-1">カテゴリ（最低1つ）</p>
          <div className="border border-gray-100 dark:border-[var(--border-subtle)] rounded-xl px-3">
            <ToggleRow label="趣味" sublabel="hobby" checked={hobbies} onChange={setHobbies} />
            <ToggleRow label="地域" sublabel="area" checked={local} onChange={setLocal} />
            <ToggleRow label="その他" sublabel="other" checked={other} onChange={setOther} />
          </div>
        </div>

        {/* クローズド・非表示設定 */}
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

        {/* 親を選択 */}
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
            KAIWAIを作成
          </button>
        ) : (
          <div className="border border-gray-200 dark:border-[var(--border-subtle)] rounded-xl p-4 space-y-3">
            <p className="text-sm text-gray-700 dark:text-[var(--fg-secondary)] text-center">KAIWAIを作成します。よろしいですか？</p>
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
                onClick={handleCreate}
                disabled={submitting}
                className="flex-1 py-2 rounded-lg text-sm bg-black text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {submitting ? "作成中..." : "作成する"}
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
