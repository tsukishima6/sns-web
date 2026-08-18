"use client";

import { useRouter } from "next/navigation";

const fallbackImg =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwai_admin.png?alt=media&token=a3a36f2a-d37f-49fb-a3a6-0914f24131a8";

// ネイティブ(posts_widget.dartのquoteBiz分岐+BusinessWidget)を踏襲。
// post.quote_bizが設定されている投稿で、引用元の店舗を埋め込みカードとして表示し、
// タップで店舗詳細ページへ遷移する。RepostEmbed/NewsQuoteEmbedと同じくLinkではなく
// div+onClick(親のLink/div+onClickとの<a>ネストを避けるため)。
export default function BizQuoteEmbed({ quotedBiz }) {
  const router = useRouter();

  if (!quotedBiz) {
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
        引用元の店舗は見つかりませんでした
      </div>
    );
  }

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/business/${quotedBiz.id}`);
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
      <img
        src={quotedBiz.photo || fallbackImg}
        alt=""
        style={{ width: "48px", height: "48px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }}
      />
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontSize: "0.85rem",
            fontWeight: 500,
            color: "var(--fg-primary)",
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {quotedBiz.name}
        </p>
        {quotedBiz.subname && (
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--fg-muted)",
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {quotedBiz.subname}
          </p>
        )}
      </div>
    </div>
  );
}
