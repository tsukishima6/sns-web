"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

const fallbackProfilePhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";

export default function PostsCarousel({ posts }) {
  const containerRef = useRef(null);

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

  if (!posts || posts.length === 0) {
    return <p style={{ color: "var(--fg-secondary)" }}>まだ投稿がありません</p>;
  }

  return (
    <div suppressHydrationWarning>
      <div
        ref={containerRef}
        className="no-scrollbar"
        style={{
          display: "flex",
          gap: "1rem",
          overflowX: "auto",
          scrollBehavior: "smooth",
          paddingTop: "16px",
          paddingBottom: "40px",
          marginTop: "54px",
          fontFamily: "Urbanist",
          marginBottom: "0",
          minHeight: "200px",
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
            <div
              style={{
                padding: "1.3rem",
                border: "1px solid var(--card-border)",
                borderRadius: "20px",
                backgroundColor: "var(--card-bg)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                isolation: "isolate",
                transform: "translateZ(0)",
                position: "relative",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              }}
            >
              {post.kaiwaiName && post.kaiwaiID && (
                <Link href={`/kaiwai/${post.kaiwaiID}`} style={{ display: "inline-block", textDecoration: "none", marginBottom: "11px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.72rem",
                      fontWeight: "600",
                      color: "#fff",
                      background: "linear-gradient(135deg, rgba(21,38,53,0.75), rgba(143,168,167,0.7))",
                      padding: "0.25rem 0.65rem",
                      borderRadius: "999px",
                    }}
                  >
                    @{post.kaiwaiName}kaiwai
                  </span>
                </Link>
              )}

              <Link
                href={`/posts/${post.userID || "unknown"}/${post.id}`}
                style={{ display: "block", textDecoration: "none", color: "inherit" }}
              >
                {post.profile && (
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "0.6rem" }}>
                    <Image
                      src={post.profile.photo || fallbackProfilePhoto}
                      alt={post.profile.name || "ユーザー"}
                      width={48}
                      height={48}
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        marginRight: "0.75rem",
                        objectFit: "cover",
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: "500", fontSize: "0.9rem", color: "var(--fg-primary)" }}>
                        {post.profile.name}
                      </span>
                      <span style={{ fontSize: "0.9rem", color: "var(--fg-secondary)", fontFamily: "Urbanist" }}>
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
                    color: "var(--fg-primary)",
                  }}
                >
                  {post.postDescription || "（本文なし）"}
                </h4>

                {post.postPhoto && (
                  <Image
                    src={post.postPhoto}
                    alt="投稿画像"
                    width={580}
                    height={326}
                    sizes="290px"
                    style={{ width: "100%", height: "auto", borderRadius: "8px", marginBottom: "1rem" }}
                  />
                )}

                {post.timePosted && (
                  <span
                    style={{
                      display: "block",
                      textAlign: "right",
                      marginTop: "0.8rem",
                      fontSize: "1rem",
                      color: "var(--fg-muted)",
                      fontFamily: "Urbanist",
                    }}
                  >
                    {new Date(post.timePosted * 1000).toLocaleString("ja-JP", {
                      year: "numeric",
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Tokyo",
                    })}
                  </span>
                )}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
