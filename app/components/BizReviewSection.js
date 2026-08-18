"use client";

import { useState } from "react";
import { addDoc, arrayUnion, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

const fallbackProfilePhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";

function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : null;
  if (!date) return "";
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" });
}

function StarRating({ value }) {
  return (
    <span style={{ fontSize: "0.85rem", color: "var(--fg-primary)", letterSpacing: "1px" }}>
      {[1, 2, 3, 4, 5].map((i) => (i <= Math.round(value) ? "★" : "☆")).join("")}
    </span>
  );
}

// ネイティブ(b_s_review_widget.dart)と同じく、レビューはbusiness側ではなく
// 投稿者(reviewer)のuser配下に平坦保存する(postcomments/bizreviewと同じパターン、
// Firestoreルールも users/{parent}/bizreview/{document} にしか作成を許可していない)。
// reviewerはprofileではなくuser参照そのもの(他機能のnowprofileパターンと異なる点に注意)。
// 平均評価はbizreviewドキュメントの再集計ではなく、business.rating_list配列への
// arrayUnionで都度追加する方式をそのまま踏襲する(ネイティブ同様、削除時にrating_listは
// 同期されない仕様だが、両プラットフォームで表示される平均値を一致させるため踏襲する)。
export default function BizReviewSection({ bizID, initialReviews }) {
  const { user, userDoc } = useAuth();
  const [reviews, setReviews] = useState(initialReviews);
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ネイティブ側もFirestoreクエリにorderByを付けていない(reviewee単一フィールドの
  // COLLECTION_GROUPインデックスのみ)ため、並び替えはクライアント側で行う
  const sorted = [...reviews].sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user || submitting || !comment.trim()) return;
    setSubmitting(true);
    try {
      const bizRef = doc(db, "business", bizID);
      await addDoc(collection(db, "users", user.uid, "bizreview"), {
        reviewer: doc(db, "users", user.uid),
        reviewee: bizRef,
        rating,
        review_comment: comment.trim(),
        timestamp: serverTimestamp(),
        ...(userDoc?.kaiwai ? { kaiwai: userDoc.kaiwai } : {}),
      });
      await updateDoc(bizRef, { rating_list: arrayUnion(rating) });

      setReviews((prev) => [
        {
          id: `local-${Date.now()}`,
          reviewerName: userDoc?.display_name || "",
          reviewerPhoto: userDoc?.photo_url || "",
          rating,
          reviewComment: comment.trim(),
          timestamp: { seconds: Date.now() / 1000, nanoseconds: 0 },
        },
        ...prev,
      ]);
      setComment("");
      setRating(4);
      setFormOpen(false);
    } catch (err) {
      console.error("review submit error:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.8rem" }}>
        <h2
          className="text-sm font-semibold text-gray-500 dark:text-[var(--fg-secondary)]"
          style={{ fontFamily: "'Urbanist', sans-serif" }}
        >
          reviews
        </h2>
        {user && !formOpen && (
          <button
            onClick={() => setFormOpen(true)}
            style={{
              fontSize: "0.8rem",
              padding: "0.4rem 0.9rem",
              borderRadius: "999px",
              border: "1px solid var(--border-subtle)",
              background: "none",
              color: "var(--fg-primary)",
              cursor: "pointer",
            }}
          >
            レビューを書く
          </button>
        )}
      </div>

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "16px",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.75rem" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                type="button"
                key={i}
                onClick={() => setRating(i)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontSize: "1.4rem",
                  color: "var(--fg-primary)",
                }}
                aria-label={`評価 ${i}`}
              >
                {i <= rating ? "★" : "☆"}
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 300))}
            placeholder="レビューを入力(300文字まで)"
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
              marginBottom: "0.5rem",
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
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
              type="submit"
              disabled={submitting || !comment.trim()}
              style={{
                padding: "0.5rem 1.1rem",
                fontSize: "0.85rem",
                fontWeight: 500,
                color: "#fff",
                background: "#000",
                border: "none",
                borderRadius: "999px",
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting || !comment.trim() ? 0.5 : 1,
              }}
            >
              {submitting ? "投稿中..." : "投稿する"}
            </button>
          </div>
        </form>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-[var(--fg-muted)]">レビューがありません</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {sorted.map((r) => (
            <div key={r.id} style={{ padding: "0.9rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                <img
                  src={r.reviewerPhoto || fallbackProfilePhoto}
                  alt={r.reviewerName || "ユーザー"}
                  style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
                />
                <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--fg-primary)" }}>
                  {r.reviewerName || "ユーザー"}
                </span>
                <StarRating value={r.rating} />
                <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginLeft: "auto" }}>
                  {formatDate(r.timestamp)}
                </span>
              </div>
              {r.reviewComment && (
                <p style={{ fontSize: "0.85rem", color: "var(--fg-secondary)", margin: 0, whiteSpace: "pre-wrap" }}>
                  {r.reviewComment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
