// ログイン必須のkaiwai作成フォーム。未ログインのクローラーには空/ローディング状態しか
// 見えず内容が無いため、検索結果には出さない(indexさせない)。
// 兄弟の/kaiwai(一覧)・/kaiwai/[kaiwaiID](詳細)はここでは影響を受けない
export const metadata = {
  robots: { index: false, follow: false },
};

export default function KaiwaiNewLayout({ children }) {
  return children;
}
