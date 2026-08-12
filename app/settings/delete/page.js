"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithPopup,
} from "firebase/auth";
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

// アカウント削除時、Firestore上の関連データを一通り削除する。
// ネイティブは「界隈ごとの退会」と「全体アカウント削除」の2段階だが、
// Webは1ボタンなのでその両方を合成して1回で行う。
async function deleteUserData(uid) {
  const userRef = doc(db, "users", uid);

  const profileSnap = await getDocs(collection(db, "users", uid, "profile"));
  const profiles = profileSnap.docs.map((d) => ({ ref: d.ref, ...d.data() }));

  // 各界隈のusers配列から自分を除去
  for (const p of profiles) {
    if (p.kaiwai) {
      try {
        await updateDoc(p.kaiwai, { users: arrayRemove(userRef) });
      } catch (e) {
        console.error("kaiwai users除去エラー:", e);
      }
    }
  }

  // 自分の投稿を削除
  const postsSnap = await getDocs(collection(db, "users", uid, "posts"));
  for (const p of postsSnap.docs) {
    await deleteDoc(p.ref);
  }

  // 自分が書いたコメントを削除（postcommentsはコメント投稿者=自分のusers/{uid}/postcommentsに
  // フラットに保存されるため、他人の投稿へのコメントもここに含まれる）
  try {
    const myComments = await getDocs(collection(db, "users", uid, "postcomments"));
    await Promise.all(myComments.docs.map((c) => deleteDoc(c.ref)));
  } catch (e) {
    console.error("自分のコメント削除エラー:", e);
  }

  // 参加しているチャット（自分のいずれかのプロフィールが参加者）を削除
  if (profiles.length > 0) {
    try {
      const chatsSnap = await getDocs(
        query(
          collection(db, "chats"),
          where("users_p", "array-contains-any", profiles.slice(0, 10).map((p) => p.ref))
        )
      );
      await Promise.all(chatsSnap.docs.map((c) => deleteDoc(c.ref)));
    } catch (e) {
      console.error("チャット削除エラー:", e);
    }
  }

  // お知らせ
  try {
    const receiptSnap = await getDocs(collection(db, "users", uid, "receipt"));
    await Promise.all(receiptSnap.docs.map((r) => deleteDoc(r.ref)));
  } catch (e) {
    console.error("お知らせ削除エラー:", e);
  }

  // プロフィール本体
  await Promise.all(profiles.map((p) => deleteDoc(p.ref)));

  // ユーザードキュメント本体
  await deleteDoc(userRef);
}

export default function SettingsDeletePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState("confirm"); // "confirm" | "reauth" | "done"
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isGoogleUser = user?.providerData?.some((p) => p.providerId === "google.com");

  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/login");
  }, [user, loading]);

  async function handleReauthAndDelete() {
    setSubmitting(true);
    setError("");
    try {
      if (isGoogleUser) {
        const provider = new GoogleAuthProvider();
        await reauthenticateWithPopup(user, provider);
      } else {
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
      }
      await deleteUserData(user.uid);
      await deleteUser(user);
      await logout();
      setStep("done");
    } catch (err) {
      switch (err.code) {
        case "auth/wrong-password":
        case "auth/invalid-credential":
          setError("パスワードが正しくありません");
          break;
        case "auth/popup-closed-by-user":
          setError("再認証がキャンセルされました");
          break;
        case "auth/requires-recent-login":
          setError("セキュリティのため再ログインが必要です。一度ログアウトして再度ログインしてください。");
          break;
        default:
          setError("削除に失敗しました。もう一度お試しください。");
      }
    } finally {
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

  if (!user && step !== "done") return null;

  if (step === "done") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 text-center">
        <p className="text-sm text-gray-600 dark:text-[var(--fg-secondary)] mb-4">アカウントを削除しました。</p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          トップへ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="text-gray-400 dark:text-[var(--fg-muted)] hover:text-gray-600 dark:hover:text-[var(--fg-secondary)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="text-base font-semibold text-gray-800 dark:text-[var(--fg-primary)]">アカウントの削除</h1>
      </div>

      {step === "confirm" && (
        <div className="space-y-5">
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 rounded-2xl p-5">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">削除する前にご確認ください</p>
            <ul className="text-xs text-red-500 dark:text-red-400 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>アカウントは完全に削除され、元に戻せません</li>
              <li>投稿・プロフィール・チャット履歴が失われます</li>
              <li>同じメールアドレスで再登録することはできません</li>
            </ul>
          </div>

          <p className="text-sm text-gray-500 dark:text-[var(--fg-secondary)]">
            本当に削除する場合は「次へ」をタップしてください。
          </p>

          <button
            onClick={() => setStep("reauth")}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            次へ（確認）
          </button>
          <Link
            href="/settings"
            className="block text-center text-sm text-gray-400 dark:text-[var(--fg-muted)] hover:text-gray-600 dark:hover:text-[var(--fg-secondary)] transition-colors"
          >
            キャンセル
          </Link>
        </div>
      )}

      {step === "reauth" && (
        <div className="space-y-5">
          <p className="text-sm text-gray-600 dark:text-[var(--fg-secondary)] leading-relaxed">
            セキュリティのため、アカウント削除の前に本人確認が必要です。
          </p>

          {!isGoogleUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--fg-primary)] mb-1">
                現在のパスワード
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--border-subtle)] dark:bg-[var(--surface)] dark:text-[var(--fg-primary)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                placeholder="••••••••"
              />
            </div>
          )}

          {isGoogleUser && (
            <p className="text-xs text-gray-400 dark:text-[var(--fg-muted)] bg-gray-50 dark:bg-[var(--surface-muted)] rounded-xl px-4 py-3">
              Googleアカウントで登録されています。次のボタンを押すとGoogle再認証が行われます。
            </p>
          )}

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            onClick={handleReauthAndDelete}
            disabled={submitting || (!isGoogleUser && !password)}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {submitting ? "削除中..." : "アカウントを削除する"}
          </button>
          <button
            onClick={() => { setStep("confirm"); setError(""); }}
            className="w-full text-sm text-gray-400 dark:text-[var(--fg-muted)] hover:text-gray-600 dark:hover:text-[var(--fg-secondary)] transition-colors"
          >
            戻る
          </button>
        </div>
      )}
    </div>
  );
}
