"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

export default function EditProfileButton({ userID }) {
  const { user } = useAuth();

  if (!user || user.uid !== userID) return null;

  return (
    <div className="mt-3 flex gap-2">
      <Link
        href="/profile/edit"
        className="inline-block px-5 py-1.5 border border-gray-300 dark:border-[var(--border-subtle)] rounded-full text-sm text-gray-700 dark:text-[var(--fg-secondary)] hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)] transition-colors"
      >
        プロフィールを編集
      </Link>
      <Link
        href="/favorites"
        className="inline-block px-4 py-1.5 border border-gray-300 dark:border-[var(--border-subtle)] rounded-full text-sm text-gray-700 dark:text-[var(--fg-secondary)] hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)] transition-colors"
      >
        ♡ お気に入り
      </Link>
      <Link
        href="/settings"
        className="inline-block px-4 py-1.5 border border-gray-300 dark:border-[var(--border-subtle)] rounded-full text-sm text-gray-700 dark:text-[var(--fg-secondary)] hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)] transition-colors"
      >
        設定
      </Link>
    </div>
  );
}
