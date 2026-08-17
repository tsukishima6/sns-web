"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

// ネイティブ(business_detail_widget.dart)のフォローボタンと同じ相互参照:
// 自分のnowprofileにfollowing_biz、ビジネス側にfollowed_profileを足し引きする。
// 見た目もネイティブに合わせ、未フォロー=primaryTextの縁取りのみ、
// フォロー中=primaryText塗りつぶし+反転色の文字、という状態のみで区別する
export default function FollowBusinessButton({ bizID }) {
  const { user, userDoc } = useAuth();
  const [following, setFollowing] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!userDoc?.nowprofile) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "business", bizID));
        if (cancelled || !snap.exists()) return;
        const followedProfile = snap.data().followed_profile || [];
        setFollowing(followedProfile.some((ref) => ref.path === userDoc.nowprofile.path));
      } catch (_) {}
    })();
    return () => {
      cancelled = true;
    };
  }, [userDoc?.nowprofile, bizID]);

  async function toggleFollow(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !userDoc?.nowprofile || pending) return;

    setPending(true);
    const bizRef = doc(db, "business", bizID);
    try {
      if (following) {
        await updateDoc(userDoc.nowprofile, { following_biz: arrayRemove(bizRef) });
        await updateDoc(bizRef, { followed_profile: arrayRemove(userDoc.nowprofile) });
        setFollowing(false);
      } else {
        await updateDoc(userDoc.nowprofile, { following_biz: arrayUnion(bizRef) });
        await updateDoc(bizRef, { followed_profile: arrayUnion(userDoc.nowprofile) });
        setFollowing(true);
      }
    } catch (e2) {
      console.error("business follow toggle error:", e2);
    } finally {
      setPending(false);
    }
  }

  if (!user) return null;

  return (
    <button
      onClick={toggleFollow}
      disabled={pending}
      style={{
        padding: "0.4rem 1.1rem",
        borderRadius: "999px",
        fontSize: "0.85rem",
        fontWeight: 600,
        fontFamily: "'Urbanist', sans-serif",
        cursor: pending ? "not-allowed" : "pointer",
        opacity: pending ? 0.6 : 1,
        border: "1.5px solid var(--fg-primary)",
        background: following ? "var(--fg-primary)" : "transparent",
        color: following ? "var(--bg-page)" : "var(--fg-primary)",
      }}
    >
      {following ? "✓ フォロー中" : "フォロー"}
    </button>
  );
}
