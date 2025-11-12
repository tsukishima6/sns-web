"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { collectionGroup, query, orderBy, getDocs, getDoc, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import Image from "next/image";
import Link from "next/link";
import KaiwaiWordCloud from "./components/wordcloud";
import BentoGallery from "./components/BentoGallery";


import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";


const fallbackProfilePhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";

// 背景パーティクル
function ParticlesBackground({ scrollY }) {
  const [inited, setInited] = useState(false);
  const particlesRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
      if (mounted) setInited(true);
    }).catch((e) => {
      console.error("initParticlesEngine error:", e);
      if (mounted) setInited(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const options = {
    background: { color: { value: "#ffffff" } },
    fullScreen: { enable: false },
    fpsLimit: 60,
    particles: {
      number: { value: 80, density: { enable: true, area: 800 } },
      color: { value: ["#2f4f4f", "#db7093", "#4682b4"] },
      shape: { type: "circle" },
      opacity: { value: 0.75 },
      size: { value: { min: 1, max: 3 } },
      move: {
        enable: true,
        speed: Math.min(4, 0.8 + Math.abs(scrollY || 0) * 0.0009),
        direction: "none",
        outModes: { default: "out" },
      },
      links: {
        enable: true,
        distance: 120,
        color: "#9aa4b2",
        opacity: 0.65,
        width: 1,
      },
    },
    detectRetina: true,
  };

  if (!inited || typeof document === "undefined") return null;

  const particleElement = (
    <div
      id="page-particles"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100%",
        zIndex: -9999,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <Particles id="page-particles" options={options} ref={particlesRef} />
    </div>
  );

  return createPortal(particleElement, document.body);
}

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const containerRef = useRef(null);

  // Firestore から投稿取得
  useEffect(() => {
    let mounted = true;
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
              } catch (e) {
                console.error("profile fetch error:", e);
              }
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
              } catch (e) {
                console.error("kaiwai fetch error:", e);
              }
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

        if (mounted) setPosts(postsData);
      } catch (err) {
        console.error("fetch posts error:", err);
      }
    }
    fetchPosts();
    return () => {
      mounted = false;
    };
  }, []);

  // 自動カルーセル
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

  // スクロール量を監視

  return (
    <>
      {/* 背景パーティクル */}
      <ParticlesBackground />

      <div style={{ position: "relative", zIndex: 2 }}>
        {/* ヘッダー（変更なし） */}
        <header
          style={{
            width: "100%",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1001,
            backgroundColor: "rgba(255,255,255,0.95)",
            backdropFilter: "saturate(120%) blur(4px)",
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
                  borderRadius: "26px",
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
              <a href="https://apps.apple.com/jp/app/kaiwai/id6469412765" target="_blank" rel="noopener noreferrer">
                <img src="/apple.svg" alt="App Store" width={28} height={28} />
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.flutterflow.tsukishima6"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img src="/googleplay.svg" alt="App Store" width={28} height={28} />
              </a>
            </div>
          </div>
        </header>

        {/* コンテンツ */}
        <div
          style={{
            fontFamily: "'Shippori Mincho', Urbanist, serif",
            maxWidth: "720px",
            padding: "4.4rem 0rem 2rem 0rem",
            margin: "0 auto",
            position: "relative",
            zIndex: 2,
          }}
        >
          <h2
            style={{
              textAlign: "center",
              fontWeight: 500,
              fontSize: "1.1rem",
              marginBottom: "1.3rem",
              lineHeight: "1.6",
              color: "#000",
            }}
          >
            界隈の数だけ、SNSがあっていい。
          </h2>

          <div
            style={{
              background: "linear-gradient(135deg, #152635, #8fa8a7)",
opacity: 0.85, 
              borderRadius: "25px",
              padding: "1.2rem",
              marginRight: "1.6rem",
              marginLeft: "1.6rem",
              marginBottom: "1.5rem",
            }}
          >
            <p style={{ color: "#fff", fontSize: "0.9rem", lineHeight: "1.8", textAlign: "center", margin: 0 }}>
              趣味、地域、悩み、職種・・<br />
              それぞれの界隈の情報にドップリ浸かる、<br />
              新しいSNSを作りました。
            </p>
          </div>
<div style={{ marginTop: "0rem", marginBottom: "0rem" }}>
            <KaiwaiWordCloud />
          </div>
          {/* 投稿カルーセル */}
          <div suppressHydrationWarning>
            {posts.length > 0 ? (
              <div
                ref={containerRef}
                style={{
                  display: "flex",
                  gap: "1rem",
                  overflowX: "auto",
                  scrollBehavior: "smooth",
                  paddingBottom: "0rem",
                  marginTop: "2.2rem",
                  fontFamily: "Urbanist",
                  marginBottom: "1rem",
                }}
              >
                {posts.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      flex: "0 0 auto",
                      minWidth: "290px",
                      maxWidth: "290px",
                      marginLeft: "0.2rem",
                    }}
                  >
                    <Link
                      href={`/posts/${post.userID || "unknown"}/${post.id}`}
                      style={{
                        display: "block",
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      <div
                        style={{
                          padding: "1.3rem",
                          border: "0.8px solid #808080",
                          borderRadius: "12px",
                          backgroundColor: "rgba(255,255,255,0.97)",
                          position: "relative",
                        }}
                      >
                        {post.profile && (
                          <div style={{ display: "flex", alignItems: "center", marginBottom: "0.6rem" }}>
                            <img
                              src={post.profile.photo || fallbackProfilePhoto}
                              alt={post.profile.name || "ユーザー"}
                              style={{
                                width: "48px",
                                height: "48px",
                                borderRadius: "50%",
                                marginRight: "0.75rem",
                                objectFit: "cover",
                              }}
                            />
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontWeight: "500", fontSize: "0.9rem", color: "#333" }}>
                                {post.profile.name}
                              </span>
                              <span style={{ fontSize: "0.9rem", color: "#666", fontFamily: "Urbanist" }}>
                                @{post.profile.ID || post.userID}
                              </span>
                            </div>
                          </div>
                        )}

                        <h4
                          style={{
                            fontSize: "1rem",
                            fontWeight: "400",
                            marginBottom: post.postPhoto ? "0.9rem" : "1.5rem",
                            color: "#333",
                          }}
                        >
                          {post.postDescription || "（本文なし）"}
                        </h4>

                        {post.postPhoto && (
                          <img
                            src={post.postPhoto}
                            alt="投稿画像"
                            style={{ width: "100%", borderRadius: "8px", marginBottom: "1rem" }}
                          />
                        )}

                        {post.timePosted && (
                          <span
                            style={{
                              position: "absolute",
                              right: "1.2rem",
                              bottom: "1.2rem",
                              fontSize: "1rem",
                              color: "#888",
                              fontFamily: "Urbanist",
                            }}
                          >
                            {new Date(post.timePosted * 1000).toLocaleString("ja-JP", {
                              year: "numeric",
                              month: "numeric",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* 界隈リンクは外に出してネストを防止 */}
                    {post.kaiwaiName && post.kaiwaiID && (
                      <Link href={`/kaiwai/${post.kaiwaiID}`} style={{ textDecoration: "none" }}>
                        <p
                          style={{
                            fontSize: "1rem",
                            marginLeft: "0.2rem",
                            fontWeight: "600",
                            background: "linear-gradient(135deg, #58b5f7, #f20089)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            marginTop: "0.5rem",
                            textAlign: "left",
                          }}
                        >
                          {post.kaiwaiName}kaiwai の投稿
                        </p>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#666" }}>まだ投稿がありません</p>
            )}
          </div>
        </div>
      </div>
<div style={{ marginTop: "0rem" }}>
  <BentoGallery />
</div>
    </>
  );
}
