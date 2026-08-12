"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

const fallbackPhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";

function formatTime(ts) {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export default function ChatListPage() {
  const { user, userDoc, loading: authLoading } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user && userDoc) loadChats();
  }, [user, userDoc]);

  async function loadChats() {
    if (!userDoc?.nowprofile || !userDoc?.kaiwai) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, "chats"),
        where("users_p", "array-contains", userDoc.nowprofile),
        where("kaiwai", "==", userDoc.kaiwai),
        orderBy("last_message_time", "desc")
      );
      const snap = await getDocs(q);

      const items = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          let otherProfile = null;

          if (data.group) {
            otherProfile = { name: data.groupname || "グループ", photo: null };
          } else {
            // DM：自分でない方のプロフィールを取得
            const otherRef =
              data.userp_a?.path === userDoc.nowprofile?.path
                ? data.userp_b
                : data.userp_a;
            if (otherRef) {
              try {
                const pfSnap = await getDoc(otherRef);
                if (pfSnap.exists()) otherProfile = pfSnap.data();
              } catch (_) {}
            }
          }

          // 未読判定
          const seenBy = data.last_message_seen_by || [];
          const isUnread = !seenBy.some((ref) => ref?.id === user.uid);

          return {
            id: d.id,
            otherProfile,
            lastMessage: data.last_message || "",
            lastMessageTime: data.last_message_time,
            isUnread,
            isGroup: !!data.group,
          };
        })
      );

      setChats(items);
    } catch (e) {
      console.error("chat list fetch error:", e);
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto" }}>
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
        kaiwa
      </h1>

      {loading ? (
        <p style={{ padding: "3rem", textAlign: "center", color: "var(--fg-muted)", fontSize: "0.9rem" }}>
          読み込み中…
        </p>
      ) : chats.length === 0 ? (
        <p style={{ padding: "3rem", textAlign: "center", color: "var(--fg-muted)", fontSize: "0.9rem" }}>
          チャットはまだありません
        </p>
      ) : (
        chats.map((chat) => (
          <Link
            key={chat.id}
            href={`/chat/${chat.id}`}
            style={{ textDecoration: "none", color: "inherit", display: "block" }}
          >
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                padding: "0.85rem 1rem",
                borderBottom: "1px solid var(--border-subtle)",
                alignItems: "center",
              }}
            >
              {/* アイコン */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <img
                  src={chat.otherProfile?.photo || fallbackPhoto}
                  alt=""
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
                {chat.isUnread && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: "#152635",
                      border: "2px solid var(--bg-page)",
                    }}
                  />
                )}
              </div>

              {/* 情報 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: "0.2rem",
                  }}
                >
                  <span
                    style={{
                      fontWeight: chat.isUnread ? 700 : 500,
                      fontSize: "0.92rem",
                      color: "var(--fg-primary)",
                      fontFamily: "'Noto Sans JP', sans-serif",
                    }}
                  >
                    {chat.otherProfile?.name || "ユーザー"}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--fg-muted)",
                      fontFamily: "'Urbanist', sans-serif",
                      flexShrink: 0,
                    }}
                  >
                    {formatTime(chat.lastMessageTime)}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.83rem",
                    color: chat.isUnread ? "var(--fg-secondary)" : "var(--fg-muted)",
                    fontFamily: "'Noto Sans JP', sans-serif",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: chat.isUnread ? 500 : 400,
                  }}
                >
                  {chat.lastMessage || "メッセージなし"}
                </p>
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
