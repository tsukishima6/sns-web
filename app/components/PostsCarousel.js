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
        style={{
          display: "flex",
          gap: "1rem",
          overflowX: "auto",
          scrollBehavior: "smooth",
          paddingBottom: "0rem",
          marginTop: "2.2rem",
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
            <Link
              href={`/posts/${post.userID || "unknown"}/${post.id}`}
              style={{ display: "block", textDecoration: "none", color: "inherit" }}
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
    </div>
  );
}
