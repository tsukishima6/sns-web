"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useSignupPrompt } from "@/lib/SignupPromptContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { useTheme } from "@/lib/ThemeContext";

const PRIVACY_TOGGLES = [
  { key: "privacySearch", label: "ユーザ検索で表示されないようにする" },
  { key: "privacyChat", label: "メッセージを受け付けない" },
  { key: "privacyFollow", label: "フォローを許可制にする" },
  { key: "privacyConceal", label: "ポストをフォロワーのみ閲覧可能にする" },
  { key: "privacyKaiwai", label: "他のKAIWAIを隠す" },
];

const PRIVACY_FIELD_MAP = {
  privacySearch: "privacy_search",
  privacyChat: "privacy_chat",
  privacyFollow: "privacy_follow",
  privacyConceal: "privacy_conceal",
  privacyKaiwai: "privacy_kaiwai",
};

const fallbackPhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";

export default function SettingsPage() {
  const { user, userDoc, loading, logout } = useAuth();
  const { openSignupPrompt } = useSignupPrompt();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [profileRef, setProfileRef] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      openSignupPrompt();
      router.push("/");
      return;
    }
    loadProfile();
  }, [user, userDoc, loading]);

  async function loadProfile() {
    const ref = userDoc?.nowprofile || doc(db, "users", user.uid, "profile", user.uid);
    setProfileRef(ref);
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) setProfile(snap.data());
    } catch (e) {
      console.error("profile load error:", e);
    }
  }

  async function handleTogglePrivacy(key, value) {
    if (!profileRef) return;
    setProfile((prev) => ({ ...prev, [PRIVACY_FIELD_MAP[key]]: value }));
    try {
      await updateDoc(profileRef, { [PRIVACY_FIELD_MAP[key]]: value });
    } catch (e) {
      console.error("privacy update error:", e);
    }
  }

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 text-sm">読み込み中...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1
        style={{ fontFamily: "'Urbanist', sans-serif" }}
        className="text-lg font-normal text-gray-800 dark:text-[var(--fg-primary)] mb-6"
      >
        Setting
      </h1>

      {/* プロフィールカード */}
      {profile && (
        <Link
          href={
            profileRef
              ? `/users/${profileRef.parent.parent.id}/profile/${profileRef.id}`
              : `/users/${user.uid}/profile/${user.uid}`
          }
          className="flex items-center gap-4 p-4 bg-white dark:bg-[var(--surface)] rounded-2xl border border-gray-100 dark:border-[var(--border-subtle)] shadow-sm mb-6 hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)] transition-colors"
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <img
            src={profile.photo || fallbackPhoto}
            alt={profile.name}
            className="w-14 h-14 rounded-full object-cover flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 dark:text-[var(--fg-primary)] text-sm">{profile.name}</p>
            <p className="text-xs text-gray-400 dark:text-[var(--fg-muted)]" style={{ fontFamily: "'Urbanist', sans-serif" }}>
              @{profile.ID}
            </p>
            <p className="text-xs text-gray-400 dark:text-[var(--fg-muted)] mt-0.5">{user.email}</p>
          </div>
          <svg className="ml-auto flex-shrink-0 text-gray-300 dark:text-[var(--fg-muted)]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      )}

      {/* メニューセクション：表示 */}
      <MenuSection label="表示">
        <ThemeMenuRow />
      </MenuSection>

      {/* メニューセクション：アカウント */}
      <MenuSection label="アカウント">
        <MenuItem
          href="/profile/edit"
          label="プロフィールを編集"
          icon={<PersonIcon />}
        />
        <MenuItem
          href="/settings/password"
          label="パスワードを変更"
          icon={<LockIcon />}
        />
      </MenuSection>

      {/* メニューセクション：プライバシー */}
      <MenuSection label="プライバシー">
        {PRIVACY_TOGGLES.map((t) => (
          <div
            key={t.key}
            className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 dark:border-[var(--border-subtle)] last:border-0"
          >
            <span
              className="text-sm text-gray-700 dark:text-[var(--fg-primary)] flex-1"
              style={{ fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif" }}
            >
              {t.label}
            </span>
            <PrivacySwitch
              checked={!!profile?.[PRIVACY_FIELD_MAP[t.key]]}
              onChange={(v) => handleTogglePrivacy(t.key, v)}
            />
          </div>
        ))}
      </MenuSection>

      {/* メニューセクション：サポート */}
      <MenuSection label="サポート">
        <MenuItem
          href="https://kaiwai.space/terms"
          label="利用規約"
          icon={<DocIcon />}
          external
        />
      </MenuSection>

      {/* ログアウト */}
      <div className="mt-6">
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl text-sm text-red-500 dark:text-red-400 border border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors font-medium"
        >
          ログアウト
        </button>
      </div>

      {/* アカウント削除 */}
      <div className="mt-3 text-center">
        <Link
          href="/settings/delete"
          className="text-xs text-gray-400 dark:text-[var(--fg-muted)] hover:text-red-400 transition-colors underline"
        >
          アカウントを削除する
        </Link>
      </div>
    </div>
  );
}

function ThemeMenuRow() {
  const { theme, setTheme } = useTheme();
  const options = [
    { key: "light", label: "ライト" },
    { key: "dark", label: "ダーク" },
    { key: "system", label: "自動" },
  ];

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span
        className="text-sm text-gray-700 dark:text-[var(--fg-primary)] flex-1"
        style={{ fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif" }}
      >
        テーマ
      </span>
      <div className="flex gap-1 bg-gray-100 dark:bg-[var(--surface-muted)] rounded-full p-1">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => setTheme(o.key)}
            style={{
              fontFamily: "'Urbanist', sans-serif",
              background:
                theme === o.key
                  ? "linear-gradient(135deg, #152635, #8fa8a7)"
                  : undefined,
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              theme === o.key
                ? "text-white"
                : "text-gray-500 dark:text-[var(--fg-muted)]"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PrivacySwitch({ checked, onChange }) {
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

function MenuSection({ label, children }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold text-gray-400 dark:text-[var(--fg-muted)] uppercase tracking-widest mb-2 px-1"
         style={{ fontFamily: "'Urbanist', sans-serif" }}>
        {label}
      </p>
      <div className="bg-white dark:bg-[var(--surface)] rounded-2xl border border-gray-100 dark:border-[var(--border-subtle)] shadow-sm overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function MenuItem({ href, label, icon, external }) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)] transition-colors border-b border-gray-50 dark:border-[var(--border-subtle)] last:border-0">
      <span className="text-gray-400 dark:text-[var(--fg-muted)] flex-shrink-0">{icon}</span>
      <span className="text-sm text-gray-700 dark:text-[var(--fg-primary)] flex-1"
            style={{ fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif" }}>
        {label}
      </span>
      <svg className="text-gray-300 dark:text-[var(--fg-muted)] flex-shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );

  if (external) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className="block" style={{ textDecoration: "none" }}>{inner}</a>;
  }
  return <Link href={href} className="block" style={{ textDecoration: "none" }}>{inner}</Link>;
}

function PersonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  );
}
