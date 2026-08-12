"use client";

import { usePathname } from "next/navigation";
import { AuthProvider } from "@/lib/AuthContext";
import FooterNav from "./components/FooterNav";
import PageHeader from "./components/PageHeader";

// これらのページは界隈コンテキスト付きの PageHeader を自前でレンダリングするので、
// ここで汎用 PageHeader を重ねて表示しない
const HAS_OWN_HEADER = [
  /^\/posts\/[^/]+\/[^/]+$/,
  /^\/kaiwai\/(?!new$)[^/]+$/,
  /^\/kaiwai\/[^/]+\/category\/[^/]+$/,
  /^\/users\/[^/]+\/profile\/[^/]+$/,
  /^\/login$/,
  /^\/signup$/,
];

// ログイン・登録画面はネイティブ版同様、アプリのヘッダー/フッターナビが無い没入型の全画面
const NO_CHROME = [/^\/login$/, /^\/signup$/];

export default function Providers({ children }) {
  const pathname = usePathname();
  const hasOwnHeader = HAS_OWN_HEADER.some((pattern) => pattern.test(pathname));
  const noChrome = NO_CHROME.some((pattern) => pattern.test(pathname));

  return (
    <AuthProvider>
      {!hasOwnHeader && <PageHeader />}
      <div style={{ paddingTop: hasOwnHeader ? 0 : "90px" }}>{children}</div>
      {!noChrome && <FooterNav />}
    </AuthProvider>
  );
}
