"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";

// ネイティブ(b_s_biz_edit_widget.dart)の2つの投稿導線を再現。
// 「引用して投稿」はログイン済みなら誰でも可、「{店舗名}として投稿」は
// 店舗のowner/membersのみUI上で表示する(ネイティブ同様、Firestoreルール側の
// サーバー検証は無い。移植元アプリのUI制約をそのまま踏襲している)。
// ownerUID/memberUIDsは文字列(uid)で受け取る(DocumentReferenceをサーバーコンポーネント
// からそのまま渡せない規約のため)。
export default function BizPostEntry({ bizID, bizName, ownerUID, memberUIDs }) {
  const { user } = useAuth();

  if (!user) return null;

  const canPostAsBiz = user.uid === ownerUID || (memberUIDs || []).includes(user.uid);
  const pillStyle = {
    display: "inline-block",
    padding: "0.5rem 1rem",
    fontSize: "0.8rem",
    borderRadius: "999px",
    border: "1px solid var(--border-subtle)",
    color: "var(--fg-primary)",
    textDecoration: "none",
  };

  return (
    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
      <Link href={`/post/new?quoteBiz=${encodeURIComponent(`business/${bizID}`)}`} style={pillStyle}>
        この店舗を引用して投稿
      </Link>
      {canPostAsBiz && (
        <Link
          href={`/post/new?asBiz=${encodeURIComponent(`business/${bizID}`)}`}
          style={{ ...pillStyle, background: "#000", color: "#fff", border: "none" }}
        >
          {bizName || "店舗"}として投稿
        </Link>
      )}
    </div>
  );
}
