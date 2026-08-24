"use client";

import { useEffect, useState } from "react";
import { doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { findExistingProfile, switchMainKaiwai, joinKaiwai } from "@/lib/kaiwaiJoin";

const buttonStyle = {
  padding: "0.5rem 1.4rem",
  borderRadius: "999px",
  fontSize: "0.85rem",
  fontWeight: 600,
  fontFamily: "'Urbanist', sans-serif",
  cursor: "pointer",
  border: "1.5px solid var(--fg-primary)",
  background: "transparent",
  color: "var(--fg-primary)",
  transition: "opacity 0.2s ease, transform 0.1s ease",
};

const primaryButtonStyle = {
  ...buttonStyle,
  border: "none",
  color: "#ffffff",
  background: "linear-gradient(135deg, #152635, #8fa8a7)",
  boxShadow: "0 4px 14px rgba(21, 38, 53, 0.28)",
};

// ネイティブ(kaiwai_items_widget.dartのカードタップ)と同じ挙動:
// 未参加なら確認ダイアログの上で新規profile作成+参加投稿まで一式実行、
// 既にkaiwai_listに含まれていれば新規参加処理はスキップしメインkaiwaiの切替のみ行う。
//
// 参加/切替はuserDoc.kaiwai・nowprofileを書き換えるが、AuthContextのuserDocは
// onAuthStateChanged時の一度きりのgetDoc結果でありFirestoreの変更を購読していない
// (CLAUDE.md記載の既知の制約)ため、成功後は画面全体をreloadしてフィード/フッター等の
// nowprofile依存UIも含め確実に最新状態を反映させる。
export default function KaiwaiJoinButton({ kaiwaiID, kaiwaiName }) {
  const { user, userDoc } = useAuth();
  const [status, setStatus] = useState("loading"); // loading | not_member | member_not_main | main | pending
  const [existingProfileRef, setExistingProfileRef] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !userDoc) return;
    let cancelled = false;
    (async () => {
      const kaiwaiRef = doc(db, "kaiwai", kaiwaiID);
      const isMember = (userDoc.kaiwai_list || []).some((ref) => ref.path === kaiwaiRef.path);
      if (!isMember) {
        if (!cancelled) setStatus("not_member");
        return;
      }
      if (userDoc.kaiwai?.id === kaiwaiID) {
        if (!cancelled) setStatus("main");
        return;
      }
      try {
        const found = await findExistingProfile(user.uid, kaiwaiRef);
        if (cancelled) return;
        setExistingProfileRef(found?.ref || null);
        setStatus("member_not_main");
      } catch (_) {
        if (!cancelled) setStatus("member_not_main");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, userDoc, kaiwaiID]);

  async function handleJoin() {
    if (!user || status === "pending") return;
    setError("");
    setStatus("pending");
    try {
      const kaiwaiRef = doc(db, "kaiwai", kaiwaiID);
      await joinKaiwai({ uid: user.uid, userDoc, kaiwaiRef, kaiwaiName });
      window.location.reload();
    } catch (e) {
      console.error("kaiwai join error:", e);
      setError("参加に失敗しました。もう一度お試しください。");
      setStatus("not_member");
    }
  }

  async function handleSwitch() {
    if (!user || !existingProfileRef || status === "pending") return;
    setError("");
    setStatus("pending");
    try {
      const kaiwaiRef = doc(db, "kaiwai", kaiwaiID);
      await switchMainKaiwai(user.uid, kaiwaiRef, existingProfileRef);
      window.location.reload();
    } catch (e) {
      console.error("kaiwai switch error:", e);
      setError("切り替えに失敗しました。もう一度お試しください。");
      setStatus("member_not_main");
    }
  }

  if (!user || status === "loading") return null;

  if (status === "main") {
    return (
      <div style={{ textAlign: "center", marginTop: "0.6rem", marginBottom: "12px" }}>
        <span
          style={{
            fontSize: "0.85rem",
            color: "var(--fg-muted)",
            fontFamily: "'Urbanist', sans-serif",
          }}
        >
          ✓ 参加中(メインKAIWAI)
        </span>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", marginTop: "0.6rem", marginBottom: "12px" }}>
      {error && (
        <p style={{ fontSize: "0.8rem", color: "#e04b4b", marginBottom: "0.4rem" }}>{error}</p>
      )}

      {status === "member_not_main" && (
        <button onClick={handleSwitch} disabled={status === "pending"} style={buttonStyle}>
          このKAIWAIをメインにする
        </button>
      )}

      {status === "not_member" && !confirming && (
        <button onClick={() => setConfirming(true)} style={buttonStyle}>
          参加する
        </button>
      )}

      {status === "not_member" && confirming && (
        <div
          style={{
            display: "inline-flex",
            flexDirection: "column",
            gap: "0.7rem",
            alignItems: "center",
            padding: "1.1rem 1.4rem",
            borderRadius: "24px",
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
          }}
        >
          <p style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--fg-secondary)", margin: 0 }}>
            {kaiwaiName}KAIWAIに参加しますか？
          </p>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button
              onClick={() => setConfirming(false)}
              style={{ ...buttonStyle, background: "transparent", color: "var(--fg-secondary)" }}
            >
              キャンセル
            </button>
            <button onClick={handleJoin} style={primaryButtonStyle}>
              参加する
            </button>
          </div>
        </div>
      )}

      {status === "pending" && (
        <p style={{ fontSize: "0.85rem", color: "var(--fg-muted)" }}>処理中...</p>
      )}
    </div>
  );
}
