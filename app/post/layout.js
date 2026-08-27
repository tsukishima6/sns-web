// ログイン必須のユーティリティページ(/post/new, /post/url)。未ログインのクローラーには
// 空/ローディング状態しか見えず内容が無いため、検索結果には出さない
export const metadata = {
  robots: { index: false, follow: false },
};

export default function PostLayout({ children }) {
  return children;
}
