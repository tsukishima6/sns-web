// ログイン必須のユーティリティページ。未ログインのクローラーには空/ローディング状態しか
// 見えず内容が無いため、検索結果には出さない(indexさせない)
export const metadata = {
  robots: { index: false, follow: false },
};

export default function NoticeLayout({ children }) {
  return children;
}
