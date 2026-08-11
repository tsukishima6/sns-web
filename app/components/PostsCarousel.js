"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

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
    return <p style={{ color: "#666" }}>まだ投稿がありません</p>;
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
          paddingBottom: "0rem",
          marginTop: "70px",
          fontFamily: "Urbanist",
          marginBottom: "1rem",
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
                border: "1px solid rgba(255,255,255,0.4)",
                borderRadius: "20px",
                backgroundColor: "rgba(255,255,255,0.25)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                isolation: "isolate",
                transform: "translateZ(0)",
                position: "relative",
              }}
            >
              {post.kaiwaiName && post.kaiwaiID && (
                <Link href={`/kaiwai/${post.kaiwaiID}`} style={{ display: "inline-block", textDecoration: "none", marginBottom: "0.5rem" }}>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.72rem",
                      fontWeight: "600",
                      color: "#fff",
                      background: "linear-gradient(135deg, #152635, #8fa8a7)",
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
                      display: "block",
                      textAlign: "right",
                      marginTop: "0.8rem",
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
