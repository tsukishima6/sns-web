"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

// ネイティブ(event_details_widget.dart)の参加ボタンと同じ相互参照:
// 自分のnowprofileに"perticipate"(ネイティブ側のフィールド名綴りのまま踏襲)、
// イベント側にevent_partを足し引きする。見た目もネイティブに合わせ、
// 参加/未参加どちらもprimaryTextの縁取りのみで、チェックアイコンの有無だけで区別する
export default function EventJoinButton({ eventID }) {
  const { user, userDoc } = useAuth();
  const [joined, setJoined] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!userDoc?.nowprofile) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "events", eventID));
        if (cancelled || !snap.exists()) return;
        const eventPart = snap.data().event_part || [];
        setJoined(eventPart.some((ref) => ref.path === userDoc.nowprofile.path));
      } catch (_) {}
    })();
    return () => {
      cancelled = true;
    };
  }, [userDoc?.nowprofile, eventID]);

  async function toggleJoin(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !userDoc?.nowprofile || pending) return;

    setPending(true);
    const eventRef = doc(db, "events", eventID);
    try {
      if (joined) {
        await updateDoc(userDoc.nowprofile, { perticipate: arrayRemove(eventRef) });
        await updateDoc(eventRef, { event_part: arrayRemove(userDoc.nowprofile) });
        setJoined(false);
      } else {
        await updateDoc(userDoc.nowprofile, { perticipate: arrayUnion(eventRef) });
        await updateDoc(eventRef, { event_part: arrayUnion(userDoc.nowprofile) });
        setJoined(true);
      }
    } catch (e2) {
      console.error("event join toggle error:", e2);
    } finally {
      setPending(false);
    }
  }

  if (!user) return null;

  return (
    <button
      onClick={toggleJoin}
      disabled={pending}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        padding: "0.5rem 1.2rem",
        borderRadius: "999px",
        fontSize: "0.9rem",
        fontWeight: 600,
        fontFamily: "'Urbanist', sans-serif",
        cursor: pending ? "not-allowed" : "pointer",
        opacity: pending ? 0.6 : 1,
        border: "1.5px solid var(--fg-primary)",
        background: "transparent",
        color: "var(--fg-primary)",
      }}
    >
      {joined ? "✓ 参加を表明済み" : "イベントに参加"}
    </button>
  );
}
