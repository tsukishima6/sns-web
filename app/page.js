"use client";

import { useEffect, useRef, useState } from "react";
import { collectionGroup, query, orderBy, getDocs, getDoc, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import Image from "next/image";
import Link from "next/link";

const fallbackProfilePhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    // Firestoreからデータ取得
    async function fetchPosts() {
      try {
        const q = query(collectionGroup(db, "posts"), orderBy("timePosted", "desc"), limit(5));
        const snap = await getDocs(q);

        const postsData = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data();
            const userID = d.ref.parent.parent?.id || null;

            let profile = null;
            if (data.postUser_profile) {
              try {
                const profileSnap = await getDoc(data.postUser_profile);
                if (profileSnap.exists()) profile = { id: profileSnap.id, ...profileSnap.data() };
              } catch (e) {}
            }

            let kaiwaiName = "";
            let kaiwaiID = "";
            if (data.kaiwai) {
              try {
                const kaiwaiSnap = await getDoc(data.kaiwai);
                if (kaiwaiSnap.exists()) {
                  kaiwaiName = kaiwaiSnap.data().name || "";
                  kaiwaiID = kaiwaiSnap.id;
                }
              } catch (e) {}
            }

            return {
              id: d.id,
              userID,
              ...data,
              profile,
              kaiwaiName,
              kaiwaiID,
              timePosted: data.timePosted?.seconds || null,
            };
          })
        );

        setPosts(postsData);
      } catch (err) {
        console.error("fetch posts error:", err);
      }
    }

    fetchPosts();
  }, []);

  // 横スクロール自動処理
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const interval = setInterval(() => {
      if (container.scrollWidth - container.scrollLeft <= container.clientWidth + 10) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        container.scrollBy({ left: 300, behavior: "smooth" });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [posts]);

  return (
    <>
      {/* ヘッダー */}
      <header
        style={{
          width: "100%",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: "#fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            maxWidth: "960px",
            margin: "0 auto",
            padding: "0.8rem 1rem",
            paddingTop: "1.2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "'Urbanist','Montserrat',sans-serif",
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <Image
              src="https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwailogo.png?alt=media&token=9cea2404-8c0c-466e-b69f-091715e423ad"
              alt="KAIWAI Logo"
              width={34}
              height={34}
              style={{ objectFit: "contain" }}
            />
          </div>

          <div style={{ marginLeft: "1.2rem", display: "flex", alignItems: "center", gap: "0.2rem" }}>
            <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "500", color: "#222" }}>kaiwai</h1>
            <div
              style={{
                background: "linear-gradient(135deg, #152635, #8fa8a7)",
                color: "#fff",
                borderRadius: "25px",
                padding: "0.1rem 0.6rem",
                fontSize: "0.9rem",
                fontWeight: "500",
                marginLeft: "0.1rem",
              }}
            >
              web版
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.25rem" }}>
            <a
              href="https://apps.apple.com/jp/app/kaiwai/id6469412765"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/apple.svg"
                alt="App Store"
                width={56}
                height={56}
                style={{ width: 28, height: 28 }}
              />
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.flutterflow.tsukishima6"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/googleplay.svg"
                alt="App Store"
                width={56}
                height={56}
                style={{ width: 28, height: 28 }}
              />
            </a>
          </div>
        </div>
      </header>

      {/* コンテンツ */}
      <div style={{ fontFamily: "'Shippori Mincho', Urbanist, serif", maxWidth: "720px", padding: "5rem 1rem 4rem" }}>
        <h2 style={{ textAlign: "center", fontWeight: 500, fontSize: "1.1rem", marginBottom: "1.3rem", lineHeight: "1.6" }}>
          界隈の数だけ、SNSがあっていい。
        </h2>

        <div style={{ background: "linear-gradient(135deg, #152635, #8fa8a7)", borderRadius: "25px", padding: "1.2rem", marginBottom: "1.5rem" }}>
          <p style={{ color: "#fff", fontSize: "0.9rem", lineHeight: "1.8", textAlign: "center", margin: 0 }}>
            趣味、地域、悩み、職種・・<br />
            それぞれの界隈の情報にドップリ浸かる、<br />
            新しいSNSを作りました。
          </p>
        </div>

        {/* 投稿カルーセル */}
        {posts.length > 0 ? (
          <div
            ref={containerRef}
            style={{
              display: "flex",
              gap: "1rem",
              overflowX: "auto",
              scrollBehavior: "smooth",
              paddingBottom: "1rem",
            }}
          >
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.userID || "unknown"}/${post.id}`}
                style={{
                  flex: "0 0 auto",
                  minWidth: "240px",
                  maxWidth: "240px",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div style={{
                  padding: "1.3rem",
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  backgroundColor: "#fff",
                  fontFamily: "Arial, sans-serif",
                  position: "relative",
                  height: "81%",
                }}>
                  {post.profile && (
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "0.6rem" }}>
                      <img
                        src={post.profile.photo || fallbackProfilePhoto}
                        alt={post.profile.name || "ユーザー"}
                        style={{ width: "48px", height: "48px", borderRadius: "50%", marginRight: "0.75rem", objectFit: "cover" }}
                      />
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: "500", fontSize: "0.9rem", color: "#333" }}>{post.profile.name}</span>
                        <span style={{ fontSize: "0.9rem", color: "#666", fontFamily: "Urbanist" }}>
                          @{post.profile.ID || post.userID}
                        </span>
                      </div>
                    </div>
                  )}

                  <h4 style={{ fontSize: "1rem", fontWeight: "400", marginBottom: post.postPhoto ? "0.9rem" : "0.5rem", color: "#333" }}>
                    {post.postDescription || "（本文なし）"}
                  </h4>
                  {post.postPhoto && <img src={post.postPhoto} alt="投稿画像" style={{ width: "100%", borderRadius: "8px", marginBottom: "1rem" }} />}
                  {post.postContent && <p style={{ fontSize: "1rem", lineHeight: "1.6", color: "#555" }}>{post.postContent}</p>}

                  {post.kaiwaiName && post.kaiwaiID && (
                    <Link href={`/kaiwai/${post.kaiwaiID}`} style={{ textDecoration: "none" }}>
                      <p style={{
                        fontSize: "1rem",
                        fontWeight: "600",
                        background: "linear-gradient(135deg, #58b5f7, #f20089)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        marginTop: "0rem",
                        marginBottom: "2.2rem",
                      }}>
                        @{post.kaiwaiName} kaiwai
                      </p>
                    </Link>
                  )}

                  {post.timePosted && (
                    <span style={{ position: "absolute", right: "1.2rem", bottom: "1.2rem", fontSize: "1rem", color: "#888", fontFamily: "Urbanist" }}>
                      {new Date(post.timePosted * 1000).toLocaleString("ja-JP", {
                        year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p style={{ color: "#666" }}>まだ投稿がありません</p>
        )}
      </div>
    </>
  );
}
