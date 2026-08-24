"use client";

import { useAppPromo } from "@/lib/AppPromoContext";

// 右下float(FloatingAppPromo)と同じダイアログを開くテキストリンク
export default function AppPromoLink({ children }) {
  const { openAppPromo } = useAppPromo();

  return (
    <span
      onClick={openAppPromo}
      style={{
        color: "#1E88E5",
        textDecoration: "underline",
        cursor: "pointer",
      }}
    >
      {children}
    </span>
  );
}
