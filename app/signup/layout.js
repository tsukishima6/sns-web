// フォームのみで固有コンテンツが無いページ。検索結果としての価値が薄いため
// indexさせない(トップページ経由の導線を優先する)
export const metadata = {
  robots: { index: false, follow: false },
};

export default function SignupLayout({ children }) {
  return children;
}
