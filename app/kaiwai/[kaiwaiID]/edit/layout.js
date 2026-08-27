// kaiwai作成者のみアクセスできる編集フォーム。未ログイン/権限無しのクローラーには
// 空/ローディング状態しか見えず内容が無いため、検索結果には出さない(indexさせない)。
// 親の/kaiwai/[kaiwaiID](詳細)はここでは影響を受けない
export const metadata = {
  robots: { index: false, follow: false },
};

export default function KaiwaiEditLayout({ children }) {
  return children;
}
