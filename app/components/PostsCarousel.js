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

    let scrollInterval = setInterval(() => {
      if (container.scrollWidth - container.scrollLeft <= container.clientWidth + 10) {
        // 末尾に来たら戻す
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        // 少しずつ右にスクロール
        container.scrollBy({ left: 300, behavior: "smooth" });
      }
    }, 2000);

    return () => clearInterval(scrollInterval);
  }, []);

  return (
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
            flex: "0 0 80%",
            minWidth: "280px",
            maxWidth: "400px",
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div
            style={{
              padding: "1.3rem",
              border: "1px solid #ddd",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              backgroundColor: "#fff",
              fontFamily: "Arial, sans-serif",
              position: "relative",
            }}
          >
            {/* 投稿者情報 */}
            {post.profile && (
              <Link
                href={`/users/${post.userID}/profile/${post.profile.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
                onClick={(e) => e.stopPropagation()} // 親リンクに伝播しないようにする
              >
                <div style={{ display: "flex", alignItems: "center", marginBottom: "0.6rem" }}>
                  <img
                    src={post.profile.photo || fallbackProfilePhoto}
                    alt={post.profile.name || "ユーザー"}
                    style={{
                      width: "47px",
                      height: "47px",
                      borderRadius: "50%",
                      marginRight: "0.75rem",
                      objectFit: "cover",
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: "500", fontSize: "0.9rem", color: "#333" }}>
                      {post.profile.name}
                    </span>
                    <span
                      style={{
                        fontSize: "0.9rem",
                        color: "#666",
                        fontFamily: "Urbanist",
                      }}
                    >
                      @{post.profile.ID || post.userID}
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* 投稿本文 */}
            <h4
              style={{
                fontSize: "1rem",
                fontWeight: "400",
                marginBottom: post.postPhoto ? "0.9rem" : "0.6rem",
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
            {post.postContent && (
              <p style={{ fontSize: "1rem", lineHeight: "1.6", color: "#555" }}>{post.postContent}</p>
            )}

            {/* kaiwai name */}
            {post.kaiwaiName && post.kaiwaiID && (
              <Link
                href={`/kaiwai/${post.kaiwaiID}`}
                style={{ textDecoration: "none" }}
                onClick={(e) => e.stopPropagation()}
              >
                <p
                  style={{
                    fontSize: "1.0rem",
                    fontWeight: "600",
                    background: "linear-gradient(135deg, #58b5f7, #f20089)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    marginTop: "0.1rem",
                    marginBottom: "2.2rem",
                  }}
                >
                  @{post.kaiwaiName} kaiwai
                </p>
              </Link>
            )}

            {/* 投稿日時 */}
            {post.timePosted && (
              <span
                style={{
                  position: "absolute",
                  right: "1.2rem",
                  bottom: "1.2rem",
                  fontSize: "1.0rem",
                  color: "#888",
                  fontFamily: "Urbanist",
                }}
              >
                {new Date(post.timePosted.seconds * 1000).toLocaleString("ja-JP", {
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
      ))}
    </div>
  );
}
