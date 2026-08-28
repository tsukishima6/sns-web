// news.imgのURLが404/期限切れ等で読み込めない場合、ブラウザがaltテキストを
// そのまま表示してしまう(2026-08-28発見)。React onErrorはSSR直後のhydration前に
// 画像取得が失敗する(403等の即時エラー)と間に合わないことがあるため、
// HTMLパーサーが同期的に紐付けるネイティブonerror属性で差し替える
// (dangerouslySetInnerHTMLでraw HTMLとして描画。src/altは要エスケープ)。
// "use client"不要・サーバーコンポーネントのままレンダーできる。
function escapeHtmlAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function styleObjectToCss(style) {
  if (!style) return "";
  return Object.entries(style)
    .map(([key, value]) => {
      const cssKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      return `${cssKey}:${value}`;
    })
    .join(";");
}

export default function NewsThumbnail({ src, alt, style }) {
  const safeSrc = escapeHtmlAttr(src || "/news.jpg");
  const safeAlt = escapeHtmlAttr(alt || "");
  const safeStyle = escapeHtmlAttr(styleObjectToCss(style));

  const html = `<img src="${safeSrc}" alt="${safeAlt}" style="${safeStyle}" onerror="if(!this.src.endsWith('/news.jpg')){this.src='/news.jpg';}">`;

  return <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: html }} />;
}
