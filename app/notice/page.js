"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  limit,
  doc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { useSignupPrompt } from "@/lib/SignupPromptContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

const fallbackPhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";

function getNotificationText(r) {
  const name = r.profile?.name || "ユーザー";
  if (r.permission) return `${name} からフォローリクエストが届いています`;
  if (r.follow) return `${name} があなたをフォローしました`;
  if (r.like) return `${name} があなたの投稿にいいねしました`;
  if (r.comment) return `${name} があなたの投稿にコメントしました`;
  if (r.post) return r.message || `${name} が投稿しました`;
  if (r.event) return r.message || `イベントのお知らせ`;
  if (r.checkin) return r.message || `チェックインのお知らせ`;
  return r.message || "お知らせ";
}

function getPostURL(postref) {
  if (!postref?.path) return null;
  const parts = postref.path.split("/");
  // users/{uid}/posts/{postID}
  if (parts.length >= 4) return `/posts/${parts[1]}/${parts[3]}`;
  return null;
}

function formatTime(ts) {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${m}/${d} ${h}:${min}`;
}

export default function NoticePage() {
  const { user, userDoc, loading: authLoading } = useAuth();
  const { openSignupPrompt } = useSignupPrompt();
  const router = useRouter();
  const [receipts, setReceipts] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      openSignupPrompt();
      router.push("/");
      return;
    }
    loadReceipts();
    loadNews();
  }, [user, authLoading, userDoc?.kaiwai]);

  // ネイティブ(a_notice_widget.dart)は現在アクティブな界隈(kaiwai、単数)の
  // ニュースを最新5件、お知らせ画面の先頭に表示する
  // 直近30日以内に絞ってからscore順にする理由は app/kaiwai/[kaiwaiID]/page.js と同じ
  // (鮮度加点が24時間で頭打ちだった旧仕様により、古い記事が上位に残り続けるのを防ぐため)
  async function loadNews() {
    if (!userDoc?.kaiwai) {
      setNews([]);
      return;
    }
    try {
      const NEWS_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
      const newsWindowStart = Timestamp.fromDate(new Date(Date.now() - NEWS_WINDOW_MS));
      const snap = await getDocs(
        query(
          collection(db, "kaiwai", userDoc.kaiwai.id, "news"),
          where("time", ">=", newsWindowStart),
          orderBy("time", "desc"),
          limit(30)
        )
      );
      const recentNews = snap.docs
        .map((d) => ({ id: d.id, kaiwaiId: userDoc.kaiwai.id, ...d.data() }))
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 5);
      setNews(recentNews);
    } catch (e) {
      console.error("notice news fetch error:", e);
    }
  }

  async function loadReceipts() {
    if (!userDoc?.kaiwai) {
      setReceipts([]);
      setLoading(false);
      return;
    }
    try {
      // ネイティブ(a_notice_widget.dart)と同じく、現在アクティブな界隈(kaiwai、単数)の
      // 通知だけに絞り込む(他の参加界隈の通知は混ぜない)
      const q = query(
        collection(db, "users", user.uid, "receipt"),
        where("kaiwai", "==", userDoc.kaiwai),
        orderBy("time", "desc"),
        limit(30)
      );
      const snap = await getDocs(q);

      const items = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();

          let profile = null;
          if (data.user_p) {
            try {
              const pfSnap = await getDoc(data.user_p);
              if (pfSnap.exists()) profile = pfSnap.data();
            } catch (_) {}
          }

          return { id: d.id, ...data, profile };
        })
      );

      setReceipts(items.filter(Boolean));
    } catch (e) {
      console.error("notice fetch error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleReject(receipt) {
    setResponding(receipt.id);
    try {
      await deleteDoc(doc(db, "users", user.uid, "receipt", receipt.id));
      setReceipts((prev) => prev.filter((r) => r.id !== receipt.id));
    } catch (e) {
      console.error("follow reject error:", e);
    } finally {
      setResponding(null);
    }
  }

  async function handleApprove(receipt) {
    if (!userDoc?.nowprofile || !receipt.user_p) return;
    setResponding(receipt.id);
    try {
      await updateDoc(userDoc.nowprofile, {
        followed: arrayUnion(receipt.user_p),
      });
      await updateDoc(receipt.user_p, {
        following: arrayUnion(userDoc.nowprofile),
      });
      await updateDoc(userDoc.nowprofile, {
        waitlist_follow: arrayRemove(receipt.user_p),
      });
      await deleteDoc(doc(db, "users", user.uid, "receipt", receipt.id));
      setReceipts((prev) => prev.filter((r) => r.id !== receipt.id));
    } catch (e) {
      console.error("follow approve error:", e);
    } finally {
      setResponding(null);
    }
  }

  if (!user) return null;

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto" }}>
      <h1
        style={{
          fontSize: "1.1rem",
          fontWeight: 600,
          padding: "1rem 1rem 0.75rem",
          fontFamily: "'Urbanist', sans-serif",
          borderBottom: "1px solid var(--border-subtle)",
          color: "var(--fg-primary)",
        }}
      >
        お知らせ
      </h1>

      {news.length > 0 && (
        <div style={{ padding: "1rem 0 0.25rem", borderBottom: "1px solid var(--border-subtle)" }}>
          <p
            style={{
              margin: "0 0 0.6rem",
              padding: "0 1rem",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--fg-secondary)",
              fontFamily: "'Urbanist', sans-serif",
            }}
          >
            界隈news
          </p>
          <div style={{ display: "flex", gap: "0.75rem", overflowX: "auto", padding: "0 1rem 1rem" }}>
            {news.map((n) => {
              const title = n.title && n.title.length > 32 ? `${n.title.slice(0, 32)}…` : n.title;
              return (
                <Link
                  key={n.id}
                  href={`/news/${n.kaiwaiId}/${n.id}`}
                  style={{
                    minWidth: "180px",
                    maxWidth: "180px",
                    flexShrink: 0,
                    borderRadius: "16px",
                    overflow: "hidden",
                    textDecoration: "none",
                    color: "var(--fg-primary)",
                    background: "var(--surface-muted)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {n.img && (
                    <img
                      src={n.img}
                      alt={n.title || ""}
                      style={{ display: "block", width: "100%", height: "90px", objectFit: "cover" }}
                    />
                  )}
                  <div style={{ padding: "0.6rem 0.7rem" }}>
                    <p style={{ margin: 0, fontSize: "0.78rem", lineHeight: "1.4", fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif" }}>
                      {title}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <p style={{ padding: "3rem", textAlign: "center", color: "var(--fg-muted)", fontSize: "0.9rem" }}>
          読み込み中…
        </p>
      ) : receipts.length === 0 ? (
        <p style={{ padding: "3rem", textAlign: "center", color: "var(--fg-muted)", fontSize: "0.9rem" }}>
          お知らせはありません
        </p>
      ) : (
        receipts.map((r) => {
          const postURL = r.like || r.comment ? getPostURL(r.postref) : null;

          const inner = (
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                padding: "0.9rem 1rem",
                borderBottom: "1px solid var(--border-subtle)",
                backgroundColor: r.seen ? "var(--surface)" : "rgba(143,168,167,0.15)",
                alignItems: "flex-start",
              }}
            >
              <img
                src={r.profile?.photo || fallbackPhoto}
                alt=""
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: "0 0 0.2rem",
                    fontSize: "0.88rem",
                    color: "var(--fg-primary)",
                    lineHeight: "1.5",
                    fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif",
                  }}
                >
                  {getNotificationText(r)}
                </p>
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--fg-muted)",
                    fontFamily: "'Urbanist', sans-serif",
                  }}
                >
                  {formatTime(r.time)}
                </span>
                {r.permission && (
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <button
                      onClick={() => handleApprove(r)}
                      disabled={responding === r.id}
                      style={{
                        padding: "0.35rem 0.9rem",
                        fontSize: "0.8rem",
                        borderRadius: "999px",
                        border: "none",
                        background: "linear-gradient(135deg, #152635, #8fa8a7)",
                        color: "#fff",
                        cursor: responding === r.id ? "not-allowed" : "pointer",
                        opacity: responding === r.id ? 0.5 : 1,
                      }}
                    >
                      承認
                    </button>
                    <button
                      onClick={() => handleReject(r)}
                      disabled={responding === r.id}
                      style={{
                        padding: "0.35rem 0.9rem",
                        fontSize: "0.8rem",
                        borderRadius: "999px",
                        border: "1px solid var(--border-subtle)",
                        background: "var(--surface)",
                        color: "var(--fg-secondary)",
                        cursor: responding === r.id ? "not-allowed" : "pointer",
                        opacity: responding === r.id ? 0.5 : 1,
                      }}
                    >
                      拒否
                    </button>
                  </div>
                )}
              </div>
              {!r.seen && (
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    backgroundColor: "#152635",
                    flexShrink: 0,
                    marginTop: "6px",
                  }}
                />
              )}
            </div>
          );

          return postURL ? (
            <Link
              key={r.id}
              href={postURL}
              style={{ textDecoration: "none", color: "inherit", display: "block" }}
            >
              {inner}
            </Link>
          ) : (
            <div key={r.id}>{inner}</div>
          );
        })
      )}
    </div>
  );
}
