"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

// いいねの実体はネイティブと同じく「自分のnowprofileのposts_like配列」に投稿参照を
// 足し引きする形(posts.numlikes/users_likedはネイティブのUIからも一切書き込まれていない
// 未使用フィールドなので、ここでも触らない)
// kaiwaiPathは文字列("kaiwai/xxx")で受け取る。サーバーコンポーネント(投稿詳細ページ)から
// DocumentReferenceをそのままpropsで渡すとクライアント境界でプレーンオブジェクト化され、
// Firestore SDKの書き込みが壊れるため(FavoriteButtonのtargetPathと同じ理由)。
export default function LikeButton({ postUserID, postID, kaiwaiPath }) {
  const { user, userDoc } = useAuth();
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!userDoc?.nowprofile) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(userDoc.nowprofile);
        if (cancelled || !snap.exists()) return;
        const postsLike = snap.data().posts_like || [];
        setLiked(postsLike.some((ref) => ref.path === `users/${postUserID}/posts/${postID}`));
      } catch (_) {}
    })();
    return () => {
      cancelled = true;
    };
  }, [userDoc?.nowprofile, postUserID, postID]);

  async function toggleLike(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !userDoc?.nowprofile || pending) return;

    setPending(true);
    const postRef = doc(db, "users", postUserID, "posts", postID);
    try {
      if (liked) {
        await updateDoc(userDoc.nowprofile, { posts_like: arrayRemove(postRef) });
        setLiked(false);
      } else {
        await updateDoc(userDoc.nowprofile, { posts_like: arrayUnion(postRef) });
        setLiked(true);
        if (postUserID !== user.uid) {
          await addDoc(collection(db, "users", postUserID, "receipt"), {
            user: doc(db, "users", user.uid),
            like: true,
            postref: postRef,
            time: serverTimestamp(),
            ...(kaiwaiPath ? { kaiwai: doc(db, kaiwaiPath) } : {}),
          });
        }
      }
    } catch (e2) {
      console.error("like toggle error:", e2);
    } finally {
      setPending(false);
    }
  }

  if (!user) return null;

  return (
    <button
      onClick={toggleLike}
      disabled={pending}
      aria-label={liked ? "いいねを取り消す" : "いいね"}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        display: "inline-flex",
        cursor: pending ? "not-allowed" : "pointer",
        // ネイティブ(posts_widget.dart)は塗り/線のアイコン形状だけで状態を表し、
        // 色は両状態ともprimaryTextで固定しているため、ここでも独自の差し色を足さない
        color: "var(--fg-primary)",
        opacity: pending ? 0.6 : 1,
      }}
    >
      {/* ネイティブのIcons.favorite_sharp/favorite_border_sharpと同じMaterial Iconsの形状 */}
      <svg width="22" height="22" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={liked ? 0 : 1.8}>
        <path d="M12.1 18.55l-.1.1-.11-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" />
      </svg>
    </button>
  );
}
