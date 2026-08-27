// ログイン必須のユーティリティページ(/settings, /settings/password, /settings/delete)。
// 未ログインのクローラーには空/ローディング状態しか見えず内容が無いため、検索結果には出さない
export const metadata = {
  robots: { index: false, follow: false },
};

export default function SettingsLayout({ children }) {
  return children;
}
