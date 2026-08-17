"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

// ネイティブの「お気に入りに追加」(投稿: b_s_delete_post_widget.dart、
// ビジネス: b_s_biz_edit_widget.dart)と同じく、対象ドキュメント自身の
// お気に入りフィールドに自分のnowprofile参照を足し引きする。
// フィールド名は投稿が"users_favorited"、ビジネス/イベントは"favorited"と異なるため
// fieldNameで指定する。
//
// targetPathは文字列("business/xxx"等)で受け取り、ここでdoc()を組み立てる。
// サーバーコンポーネント(投稿/ビジネス/イベント詳細ページ)からDocumentReferenceを
// そのままpropsで渡すと、クライアント境界を越える際にプレーンオブジェクトへ
// シリアライズされてしまいFirestore SDKのメソッド呼び出しが壊れるため。
export default function FavoriteButton({ targetPath, fieldName = "users_favorited" }) {
  const { user, userDoc } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const [pending, setPending] = useState(false);
  const targetRef = doc(db, targetPath);

  useEffect(() => {
    if (!userDoc?.nowprofile) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, targetPath));
        if (cancelled || !snap.exists()) return;
        const favoritedList = snap.data()[fieldName] || [];
        setFavorited(favoritedList.some((ref) => ref.path === userDoc.nowprofile.path));
      } catch (_) {}
    })();
    return () => {
      cancelled = true;
    };
  }, [userDoc?.nowprofile, targetPath, fieldName]);

  async function toggleFavorite(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !userDoc?.nowprofile || pending) return;

    setPending(true);
    try {
      if (favorited) {
        await updateDoc(targetRef, { [fieldName]: arrayRemove(userDoc.nowprofile) });
        setFavorited(false);
      } else {
        await updateDoc(targetRef, { [fieldName]: arrayUnion(userDoc.nowprofile) });
        setFavorited(true);
      }
    } catch (e2) {
      console.error("favorite toggle error:", e2);
    } finally {
      setPending(false);
    }
  }

  if (!user) return null;

  return (
    <button
      onClick={toggleFavorite}
      disabled={pending}
      aria-label={favorited ? "お気に入りから削除" : "お気に入りに追加"}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        cursor: pending ? "not-allowed" : "pointer",
        fontSize: "1.2rem",
        lineHeight: 1,
        // いいねボタンと同じ考え方(ネイティブは色ではなくアイコン形状で状態を表す)で、
        // 独自の差し色は使わずprimaryText相当の色に統一する
        color: "var(--fg-primary)",
        opacity: pending ? 0.6 : 1,
      }}
    >
      {favorited ? "★" : "☆"}
    </button>
  );
}
