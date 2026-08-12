"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

export default function SettingsPasswordPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    setEmail(user.email || "");
  }, [user, loading]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err) {
      switch (err.code) {
        case "auth/user-not-found":
          setError("このメールアドレスは登録されていません");
          break;
        case "auth/invalid-email":
          setError("メールアドレスの形式が正しくありません");
          break;
        default:
          setError("送信に失敗しました。もう一度お試しください。");
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

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="text-gray-400 dark:text-[var(--fg-muted)] hover:text-gray-600 dark:hover:text-[var(--fg-secondary)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <h1 className="text-base font-semibold text-gray-800 dark:text-[var(--fg-primary)]">パスワードを変更</h1>
      </div>

      {sent ? (
        <div className="text-center py-12 px-4">
          <div className="w-14 h-14 bg-green-50 dark:bg-green-950/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-[var(--fg-primary)] mb-1">メールを送信しました</p>
          <p className="text-xs text-gray-400 dark:text-[var(--fg-muted)] mb-6">{email} にパスワードリセット用のリンクを送りました。</p>
          <Link
            href="/settings"
            className="inline-block px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            設定に戻る
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-sm text-gray-500 dark:text-[var(--fg-secondary)] leading-relaxed">
            パスワードリセット用のリンクをメールにて送信します。
            登録されているメールアドレスを確認してください。
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--fg-primary)] mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--border-subtle)] dark:bg-[var(--surface)] dark:text-[var(--fg-primary)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="example@email.com"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {submitting ? "送信中..." : "リセットメールを送信"}
          </button>
        </form>
      )}
    </div>
  );
}
