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
];

export default function Providers({ children }) {
  const pathname = usePathname();
  const hasOwnHeader = HAS_OWN_HEADER.some((pattern) => pattern.test(pathname));

  return (
    <AuthProvider>
      {!hasOwnHeader && <PageHeader />}
      <div style={{ paddingTop: hasOwnHeader ? 0 : "120px" }}>{children}</div>
      <FooterNav />
    </AuthProvider>
  );
}
