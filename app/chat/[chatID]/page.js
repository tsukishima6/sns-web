"use client";

import { useEffect, useState, useRef } from "react";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { useSignupPrompt } from "@/lib/SignupPromptContext";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const fallbackPhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";

function formatTime(ts) {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export default function ChatThreadPage() {
  const { user, userDoc } = useAuth();
  const { openSignupPrompt } = useSignupPrompt();
  const router = useRouter();
  const params = useParams();
  const chatID = params.chatID;

  const [chatData, setChatData] = useState(null);
  const [otherProfile, setOtherProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);
  const fetchedRef = useRef({}); // プロフィール二重取得防止

  useEffect(() => {
    if (user === null) {
      openSignupPrompt();
      router.push("/");
    }
  }, [user]);

  // チャット情報と相手プロフィールを取得
  useEffect(() => {
    if (!chatID || !user || !userDoc) return;

    async function loadChat() {
      try {
        const chatSnap = await getDoc(doc(db, "chats", chatID));
        if (!chatSnap.exists()) return;
        const data = chatSnap.data();
        setChatData(data);

        if (!data.group) {
          const otherRef =
            data.userp_a?.path === userDoc?.nowprofile?.path
              ? data.userp_b
              : data.userp_a;
          if (otherRef) {
            const pfSnap = await getDoc(otherRef);
            if (pfSnap.exists()) setOtherProfile(pfSnap.data());
          }
        }

        // 既読にする
        if (user) {
          await updateDoc(doc(db, "chats", chatID), {
            last_message_seen_by: arrayUnion(doc(db, "users", user.uid)),
          });
        }
      } catch (e) {
        console.error("chat load error:", e);
      }
    }

    loadChat();
  }, [chatID, user, userDoc]);

  // メッセージのリアルタイム購読
  useEffect(() => {
    if (!chatID) return;

    const q = query(
      collection(db, "chats", chatID, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(msgs);

      // 未取得のプロフィールを非同期で取得
      msgs.forEach(async (msg) => {
        const path = msg.profile?.path;
        if (path && !fetchedRef.current[path]) {
          fetchedRef.current[path] = true;
          try {
            const pfSnap = await getDoc(msg.profile);
            if (pfSnap.exists()) {
              setProfiles((prev) => ({ ...prev, [path]: pfSnap.data() }));
            }
          } catch (_) {}
        }
      });
    });

    return () => unsub();
  }, [chatID]);

  // 新着メッセージで最下部へスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!text.trim() || sending || !user) return;
    const content = text.trim();
    setText("");
    setSending(true);

    try {
      const chatRef = doc(db, "chats", chatID);
      await addDoc(collection(db, "chats", chatID, "messages"), {
        user: doc(db, "users", user.uid),
        chat: chatRef,
        text: content,
        timestamp: serverTimestamp(),
        profile: userDoc?.nowprofile || null,
      });

      await updateDoc(chatRef, {
        last_message: content,
        last_message_time: serverTimestamp(),
        last_message_sent_by: doc(db, "users", user.uid),
        last_message_sentby_p: userDoc?.nowprofile || null,
        last_message_seen_by: [doc(db, "users", user.uid)],
      });
    } catch (e) {
      console.error("send error:", e);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  if (!user) return null;

  const headerName = chatData?.group
    ? chatData.groupname || "グループ"
    : otherProfile?.name || "チャット";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100dvh - 56px - 60px)", // global header + footer nav
        maxWidth: "720px",
        margin: "0 auto",
      }}
    >
      {/* チャットヘッダー */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.75rem 1rem",
          borderBottom: "1px solid var(--border-subtle)",
          backgroundColor: "var(--surface)",
          flexShrink: 0,
        }}
      >
        <Link href="/chat" style={{ color: "var(--fg-muted)", lineHeight: 1 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        {otherProfile?.photo && (
          <img
            src={otherProfile.photo}
            alt=""
            style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover" }}
          />
        )}
        <span
          style={{
            fontWeight: 600,
            fontSize: "0.95rem",
            fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif",
            color: "var(--fg-primary)",
          }}
        >
          {headerName}
        </span>
      </div>

      {/* メッセージ一覧 */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem 0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
        }}
      >
        {messages.map((msg) => {
          const isMe = msg.profile?.path === userDoc?.nowprofile?.path;
          const senderProfile = msg.profile?.path ? profiles[msg.profile.path] : null;

          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                flexDirection: isMe ? "row-reverse" : "row",
                alignItems: "flex-end",
                gap: "0.4rem",
              }}
            >
              {!isMe && (
                <img
                  src={senderProfile?.photo || fallbackPhoto}
                  alt=""
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                  }}
                />
              )}
              <div
                style={{
                  maxWidth: "72%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMe ? "flex-end" : "flex-start",
                  gap: "0.15rem",
                }}
              >
                {!isMe && senderProfile?.name && (
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--fg-muted)",
                      fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif",
                    }}
                  >
                    {senderProfile.name}
                  </span>
                )}
                <div
                  style={{
                    backgroundColor: isMe ? "#152635" : "var(--surface-muted)",
                    color: isMe ? "#fff" : "var(--fg-primary)",
                    padding: "0.55rem 0.9rem",
                    borderRadius: isMe
                      ? "18px 18px 4px 18px"
                      : "18px 18px 18px 4px",
                    fontSize: "0.9rem",
                    lineHeight: "1.5",
                    fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif",
                    wordBreak: "break-word",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.text}
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt=""
                      style={{ display: "block", maxWidth: "100%", borderRadius: "8px", marginTop: "0.4rem" }}
                    />
                  )}
                </div>
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--fg-muted)",
                    fontFamily: "'Urbanist', sans-serif",
                  }}
                >
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 入力フォーム */}
      <form
        onSubmit={handleSend}
        style={{
          display: "flex",
          gap: "0.5rem",
          padding: "0.65rem 0.75rem",
          borderTop: "1px solid var(--border-subtle)",
          backgroundColor: "var(--surface)",
          flexShrink: 0,
          alignItems: "flex-end",
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力…"
          rows={1}
          style={{
            flex: 1,
            border: "1px solid var(--border-subtle)",
            borderRadius: "20px",
            padding: "0.55rem 1rem",
            fontSize: "0.9rem",
            fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif",
            resize: "none",
            outline: "none",
            lineHeight: "1.5",
            maxHeight: "120px",
            overflowY: "auto",
            backgroundColor: "var(--surface)",
            color: "var(--fg-primary)",
          }}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background:
              sending || !text.trim()
                ? "#ddd"
                : "linear-gradient(135deg, #152635, #8fa8a7)",
            border: "none",
            cursor: sending || !text.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "background 0.15s",
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
