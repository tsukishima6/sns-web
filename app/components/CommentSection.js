"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  getDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

const fallbackPhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";

export default function CommentSection({ postUserID, postID, kaiwaiPath }) {
  const { user, userDoc } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadComments() {
    try {
      const commentsRef = collection(
        db,
        "users",
        postUserID,
        "posts",
        postID,
        "postcomments"
      );
      const q = query(commentsRef, orderBy("timePosted", "asc"));
      const snap = await getDocs(q);

      const loaded = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          let profile = null;
          if (data.commentuser_pf) {
            try {
              const pfSnap = await getDoc(data.commentuser_pf);
              if (pfSnap.exists()) {
                profile = pfSnap.data();
              }
            } catch (_) {}
          }
          return {
            id: d.id,
            comment: data.comment || "",
            timePosted: data.timePosted,
            userID: data.user?.id || null,
            profile,
          };
        })
      );
      setComments(loaded);
    } catch (e) {
      console.error("comment load error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComments();
  }, [postUserID, postID]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setSubmitting(true);

    try {
      // コメント投稿者のプロフィール参照を取得
      let commentUserPfRef = null;
      if (userDoc?.nowprofile) {
        commentUserPfRef = userDoc.nowprofile;
      } else {
        commentUserPfRef = doc(db, "users", user.uid, "profile", user.uid);
      }

      const postRef = doc(db, "users", postUserID, "posts", postID);
      const postUserRef = doc(db, "users", postUserID);
      const commenterRef = doc(db, "users", user.uid);
      const kaiwaiRef = kaiwaiPath ? doc(db, ...kaiwaiPath.split("/")) : null;

      const commentsRef = collection(
        db,
        "users",
        postUserID,
        "posts",
        postID,
        "postcomments"
      );

      await addDoc(commentsRef, {
        comment: text.trim(),
        timePosted: serverTimestamp(),
        user: commenterRef,
        post: postRef,
        postuser: postUserRef,
        commentuser_pf: commentUserPfRef,
        ...(kaiwaiRef ? { kaiwai: kaiwaiRef } : {}),
      });

      setText("");
      await loadComments();
    } catch (e) {
      console.error("comment submit error:", e);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentID) {
    if (!confirm("このコメントを削除しますか？")) return;
    try {
      await deleteDoc(doc(db, "users", postUserID, "posts", postID, "postcomments", commentID));
      setComments((prev) => prev.filter((c) => c.id !== commentID));
    } catch (e) {
      console.error("comment delete error:", e);
    }
  }

  const formatTime = (ts) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${m}月${d}日 ${h}:${min}`;
  };

  return (
    <div style={{ borderTop: "1px solid #eee", marginTop: "0.5rem" }}>
      {/* コメント一覧 */}
      <div>
        {loading ? (
          <p style={{ padding: "1rem", color: "#999", fontSize: "0.85rem", textAlign: "center" }}>
            読み込み中…
          </p>
        ) : comments.length === 0 ? (
          <p style={{ padding: "1.2rem 1rem", color: "#aaa", fontSize: "0.85rem" }}>
            まだコメントはありません
          </p>
        ) : (
          comments.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                gap: "0.75rem",
                padding: "0.9rem 1rem",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <img
                src={c.profile?.photo || fallbackPhoto}
                alt={c.profile?.name || ""}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  objectFit: "cover",
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.2rem" }}>
                  <span style={{ fontWeight: "500", fontSize: "0.88rem", color: "#222", fontFamily: "Urbanist, sans-serif" }}>
                    {c.profile?.name || "ユーザー"}
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "#aaa", fontFamily: "Urbanist, sans-serif" }}>
                    {formatTime(c.timePosted)}
                  </span>
                  {user && c.userID === user.uid && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{
                        marginLeft: "auto",
                        background: "none",
                        border: "none",
                        color: "#bbb",
                        fontSize: "0.78rem",
                        cursor: "pointer",
                        fontFamily: "Noto Sans JP, sans-serif",
                      }}
                    >
                      削除
                    </button>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#333", lineHeight: "1.5", fontFamily: "Noto Sans JP, sans-serif" }}>
                  {c.comment}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* コメント入力フォーム */}
      {user ? (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            gap: "0.5rem",
            padding: "0.8rem 1rem",
            borderTop: "1px solid #eee",
            alignItems: "flex-end",
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="コメントを入力…"
            rows={2}
            style={{
              flex: 1,
              border: "1px solid #ddd",
              borderRadius: "10px",
              padding: "0.6rem 0.8rem",
              fontSize: "0.9rem",
              fontFamily: "Noto Sans JP, sans-serif",
              resize: "none",
              outline: "none",
              lineHeight: "1.5",
            }}
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            style={{
              background: "linear-gradient(135deg, #152635, #8fa8a7)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "0.6rem 1rem",
              fontSize: "0.85rem",
              cursor: submitting || !text.trim() ? "not-allowed" : "pointer",
              opacity: submitting || !text.trim() ? 0.5 : 1,
              fontFamily: "Urbanist, sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            {submitting ? "送信中" : "送信"}
          </button>
        </form>
      ) : (
        <p style={{ padding: "1rem", color: "#aaa", fontSize: "0.85rem" }}>
          コメントするには{" "}
          <a href="/login" style={{ color: "#152635", textDecoration: "underline" }}>
            ログイン
          </a>
          が必要です
        </p>
      )}
    </div>
  );
}
