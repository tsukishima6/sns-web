"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

// ネイティブ(business_detail_widget.dart)のいいねハートアイコンと同じく、
// ビジネスドキュメント自身のlikedに自分のユーザー参照(profileではなくuser)を足し引きする
export default function BusinessLikeButton({ bizID }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "business", bizID));
        if (cancelled || !snap.exists()) return;
        const likedList = snap.data().liked || [];
        setLiked(likedList.some((ref) => ref.path === `users/${user.uid}`));
      } catch (_) {}
    })();
    return () => {
      cancelled = true;
    };
  }, [user, bizID]);

  async function toggleLike(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user || pending) return;

    setPending(true);
    const bizRef = doc(db, "business", bizID);
    const userRef = doc(db, "users", user.uid);
    try {
      if (liked) {
        await updateDoc(bizRef, { liked: arrayRemove(userRef) });
        setLiked(false);
      } else {
        await updateDoc(bizRef, { liked: arrayUnion(userRef) });
        setLiked(true);
      }
    } catch (e2) {
      console.error("business like toggle error:", e2);
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
        cursor: pending ? "not-allowed" : "pointer",
        fontSize: "1.2rem",
        lineHeight: 1,
        color: "var(--fg-primary)",
        opacity: pending ? 0.6 : 1,
      }}
    >
      {liked ? "♥" : "♡"}
    </button>
  );
}
