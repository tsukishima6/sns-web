"use client";

import { useRouter } from "next/navigation";

function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : null;
  if (!date) return "";
  return date.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
  });
}

// ネイティブ(newsquote_widget.dart)がquote_news != nullの投稿でニュース記事を引用カード
// (タイトル+サイト名+日付+サムネイル)として表示し、タップでニュース詳細(NewsDetailWidget)へ
// 遷移するのを踏襲。RepostEmbedと同じ理由(<a>のネストを避ける)でLinkではなくdiv+onClick。
export default function NewsQuoteEmbed({ quotedNews }) {
  const router = useRouter();

  if (!quotedNews) {
    return (
      <div
        style={{
          border: "1px solid var(--border-subtle)",
          borderRadius: "12px",
          padding: "0.75rem",
          marginBottom: "0.75rem",
          fontSize: "0.8rem",
          color: "var(--fg-muted)",
        }}
      >
        引用元のニュースは見つかりませんでした
      </div>
    );
  }

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/news/${quotedNews.kaiwaiId}/${quotedNews.id}`);
  }

  return (
    <div
      onClick={handleClick}
      role="link"
      tabIndex={0}
      style={{
        display: "flex",
        gap: "0.75rem",
        alignItems: "center",
        border: "1px solid var(--border-subtle)",
        borderRadius: "12px",
        padding: "0.75rem",
        marginBottom: "0.75rem",
        cursor: "pointer",
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "0.85rem",
            fontWeight: 500,
            color: "var(--fg-primary)",
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {quotedNews.title}
        </p>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginTop: "0.4rem",
            fontSize: "0.75rem",
            color: "var(--fg-muted)",
          }}
        >
          {quotedNews.sitename && <span>{quotedNews.sitename}</span>}
          {quotedNews.time && <span>{formatTime(quotedNews.time)}</span>}
        </div>
      </div>
      {quotedNews.img && (
        <img
          src={quotedNews.img}
          alt=""
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "8px",
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      )}
    </div>
  );
}
