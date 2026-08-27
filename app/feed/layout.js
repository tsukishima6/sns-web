// ログイン必須の個人向けタイムライン。未ログインのクローラーには空/ローディング状態しか
// 見えず内容が無いため、検索結果には出さない(indexさせない)
export const metadata = {
  robots: { index: false, follow: false },
};

export default function FeedLayout({ children }) {
  return children;
}
