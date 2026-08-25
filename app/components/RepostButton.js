"use client";

import { useState } from "react";
import { addDoc, collection, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

const menuItemStyle = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "0.6rem 0.9rem",
  fontSize: "0.85rem",
  color: "var(--fg-primary)",
  background: "none",
  border: "none",
  cursor: "pointer",
};

// ネイティブ(b_s_repost_select_widget.dart/b_s_repost_quote_widget.dart)と同じく、
// 独立した新規投稿ドキュメントをusers/{uid}/posts配下に作る形で実装する(既存投稿への
// カウンタ加算ではない)。repostフィールドに元投稿へのDocumentReferenceを持たせ、
// postDescriptionが半角スペース1文字なら単純リポスト、それ以外なら引用リポストという
// ネイティブの暗黙ルール(区別用フラグフィールドは無い)をそのまま踏襲する。
// postUserはprofileではなくuser ref(ネイティブのcurrentUserReference相当)だが、
// web版の一覧・詳細表示はpostUser_profileを見て描画するため、post/newと同じくこちらも設定する。
// 通知(receipt)は作成しない(ネイティブにも無い)。
//
// postPath/kaiwaiPathは文字列で受け取る(LikeButton/FavoriteButtonと同じ理由で、
// サーバーコンポーネントからDocumentReferenceを直接propsで渡すとクライアント境界で壊れる)。
export default function RepostButton({ postPath, kaiwaiPath }) {
  const { user, userDoc } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const [pending, setPending] = useState(false);

  if (!user) return null;

  function stop(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function createRepost(description) {
    if (pending) return;
    setPending(true);
    try {
      const profileRef =
        userDoc?.nowprofile || doc(db, "users", user.uid, "profile", user.uid);
      await addDoc(collection(db, "users", user.uid, "posts"), {
        postDescription: description,
        postUser: doc(db, "users", user.uid),
        postUser_profile: profileRef,
        repost: doc(db, postPath),
        kaiwai: kaiwaiPath ? doc(db, kaiwaiPath) : null,
        timePosted: serverTimestamp(),
        numlikes: 0,
        amount_comment: 0,
        postOwner: true,
        users_liked: [],
        users_favorited: [],
        hashtags: [],
      });
      setMenuOpen(false);
      setQuoteOpen(false);
      setQuoteText("");
    } catch (e2) {
      console.error("repost error:", e2);
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={(e) => {
          stop(e);
          setMenuOpen((v) => !v);
        }}
        disabled={pending}
        aria-label="リポスト"
        style={{
          background: "none",
          border: "none",
          padding: 0,
          display: "inline-flex",
          cursor: pending ? "not-allowed" : "pointer",
          // いいね・お気に入りボタンと同じ考え方(ネイティブは色ではなくアイコン形状/状態変化で
          // 表現する)で、独自の差し色は使わずprimaryText相当の色に統一する
          color: "var(--fg-primary)",
          opacity: pending ? 0.6 : 1,
        }}
      >
        {/* ネイティブ(posts_widget.dart)のIcons.repeatと同じMaterial Iconsの形状 */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v5z" />
        </svg>
      </button>

      {menuOpen && (
        <>
          <div
            onClick={(e) => {
              stop(e);
              setMenuOpen(false);
            }}
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
          />
          <div
            onClick={stop}
            style={{
              position: "absolute",
              top: "1.6rem",
              right: 0,
              zIndex: 41,
              background: "var(--surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "10px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              overflow: "hidden",
              minWidth: "140px",
            }}
          >
            <button
              onClick={(e) => {
                stop(e);
                createRepost(" ");
              }}
              style={menuItemStyle}
            >
              リポスト
            </button>
            <button
              onClick={(e) => {
                stop(e);
                setMenuOpen(false);
                setQuoteOpen(true);
              }}
              style={menuItemStyle}
            >
              引用リポスト
            </button>
          </div>
        </>
      )}

      {quoteOpen && (
        <div
          onClick={stop}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "16px",
              padding: "1.25rem",
              width: "100%",
              maxWidth: "420px",
            }}
          >
            <p
              style={{
                fontSize: "0.9rem",
                fontWeight: 500,
                color: "var(--fg-primary)",
                marginBottom: "0.75rem",
              }}
            >
              引用リポスト
            </p>
            <textarea
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              placeholder="コメントを追加"
              rows={4}
              style={{
                width: "100%",
                padding: "0.6rem",
                border: "1px solid var(--border-subtle)",
                borderRadius: "10px",
                fontSize: "0.85rem",
                resize: "none",
                color: "var(--fg-primary)",
                background: "transparent",
                marginBottom: "0.75rem",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                onClick={(e) => {
                  stop(e);
                  setQuoteOpen(false);
                  setQuoteText("");
                }}
                style={{
                  padding: "0.5rem 1rem",
                  fontSize: "0.85rem",
                  color: "var(--fg-secondary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                キャンセル
              </button>
              <button
                onClick={(e) => {
                  stop(e);
                  createRepost(quoteText.trim() || " ");
                }}
                disabled={pending}
                style={{
                  padding: "0.5rem 1.1rem",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                  color: "#fff",
                  background: "#000",
                  border: "none",
                  borderRadius: "999px",
                  cursor: pending ? "not-allowed" : "pointer",
                  opacity: pending ? 0.6 : 1,
                }}
              >
                {pending ? "投稿中..." : "投稿する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
