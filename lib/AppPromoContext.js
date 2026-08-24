"use client";

import { createContext, useContext, useState, useCallback } from "react";

const AppPromoContext = createContext(null);

// 右下floatボタン(FloatingAppPromo)のApp Store/Google Play/ブラウザでサインアップ
// ダイアログを、フロート以外の場所(テキストリンク等)からも同じものとして開けるようにする
export function AppPromoProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openAppPromo = useCallback(() => setOpen(true), []);
  const closeAppPromo = useCallback(() => setOpen(false), []);

  return (
    <AppPromoContext.Provider value={{ open, openAppPromo, closeAppPromo }}>
      {children}
    </AppPromoContext.Provider>
  );
}

export function useAppPromo() {
  const ctx = useContext(AppPromoContext);
  if (!ctx) throw new Error("useAppPromo must be used within AppPromoProvider");
  return ctx;
}
