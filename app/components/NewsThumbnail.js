"use client";

// news.imgのURLが404/期限切れ等で読み込めない場合、ブラウザがaltテキストを
// そのまま表示してしまう(2026-08-28発見)。onErrorでnews.jpgに差し替える。
export default function NewsThumbnail({ src, alt, style }) {
  return (
    <img
      src={src}
      alt={alt}
      style={style}
      onError={(e) => {
        if (e.currentTarget.src.endsWith("/news.jpg")) return;
        e.currentTarget.src = "/news.jpg";
      }}
    />
  );
}
