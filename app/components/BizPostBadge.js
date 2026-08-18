"use client";

import { useRouter } from "next/navigation";

const fallbackImg =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwai_admin.png?alt=media&token=a3a36f2a-d37f-49fb-a3a6-0914f24131a8";

// ネイティブ(posts_widget.dartの`asbiz != null`分岐+biz_post_widget.dart)を踏襲。
// post.asbizが設定されている投稿は、通常のユーザープロフィール行の代わりに
// 店舗のロゴ+店名を表示し、タップで店舗詳細ページへ遷移する。
// フィード/投稿詳細どちらも投稿カード全体が既にクリッカブル(Link/div+onClick)なため、
// stopPropagationで自分だけ独立したタップ領域にする(RepostEmbed/NewsQuoteEmbedと同じ理由)。
export default function BizPostBadge({ bizID, bizName, bizPhoto }) {
  const router = useRouter();

  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/business/${bizID}`);
  }

  return (
    <div
      onClick={handleClick}
      role="link"
      tabIndex={0}
      style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", cursor: "pointer" }}
    >
      <img
        src={bizPhoto || fallbackImg}
        alt={bizName || "店舗"}
        style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
      <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--fg-primary)", margin: 0 }}>
        {bizName || "店舗"}
      </p>
    </div>
  );
}
