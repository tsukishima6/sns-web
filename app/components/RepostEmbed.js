"use client";

import { useRouter } from "next/navigation";

const fallbackProfilePhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";

function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : null;
  if (!date) return "";
  return date.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ネイティブ(posts_widget.dart)がrepost != nullの投稿を「元投稿を取得し、同じ投稿カードを
// ネストしてカード内に埋め込み表示、タップで元投稿詳細へ遷移」という形にしているのを踏襲。
// フィードのPostCard(next/link Linkでラップ済み)の内側に入ることがあり、<a>のネストは
// 無効なHTMLになるため、Linkではなくdiv+onClickでナビゲーションする(ネイティブのInkWellと
// 同じくハイパーリンクではなくタップハンドラという扱い)。
export default function RepostEmbed({ repostedPost }) {
  const router = useRouter();

  if (!repostedPost) {
    return (
      <div
        style={{
          border: "0.5px solid var(--border-subtle)",
          borderRadius: "12px",
          padding: "0.75rem",
          marginBottom: "0.75rem",
          fontSize: "0.8rem",
          color: "var(--fg-muted)",
        }}
      >
        元の投稿は削除されています
      </div>
    );
  }

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/posts/${repostedPost.userID}/${repostedPost.id}`);
  }

  return (
    <div
      onClick={handleClick}
      role="link"
      tabIndex={0}
      style={{
        border: "0.5px solid var(--border-subtle)",
        borderRadius: "12px",
        padding: "0.75rem",
        marginBottom: "0.75rem",
        cursor: "pointer",
      }}
    >
      {repostedPost.profile && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
          <img
            src={repostedPost.profile.photo || fallbackProfilePhoto}
            alt={repostedPost.profile.name || "ユーザー"}
            style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
          />
          <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--fg-primary)" }}>
            {repostedPost.profile.name}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>
            {formatTime(repostedPost.timePosted)}
          </span>
        </div>
      )}
      {repostedPost.postDescription?.trim() && (
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--fg-secondary)",
            margin: 0,
            whiteSpace: "pre-wrap",
          }}
        >
          {repostedPost.postDescription}
        </p>
      )}
      {repostedPost.postPhoto && (
        <img
          src={repostedPost.postPhoto}
          alt=""
          style={{
            width: "100%",
            borderRadius: "8px",
            marginTop: "0.5rem",
            maxHeight: "200px",
            objectFit: "cover",
          }}
        />
      )}
    </div>
  );
}
