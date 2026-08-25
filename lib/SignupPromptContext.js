"use client";

import { createContext, useContext, useState, useCallback } from "react";

const SignupPromptContext = createContext(null);

// 未ログイン状態でログインが必要な操作(bottomnavタップ・保護ページへの直接アクセス等)を
// 行おうとした時に、/loginへ問答無用で飛ばすのではなくグラスモーフィズムのダイアログで
// 「アカウントが必要です」と案内するための共有state。AppPromoContextと同じ形。
export function SignupPromptProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const openSignupPrompt = useCallback((msg) => {
    setMessage(msg || "");
    setOpen(true);
  }, []);
  const closeSignupPrompt = useCallback(() => setOpen(false), []);

  return (
    <SignupPromptContext.Provider value={{ open, message, openSignupPrompt, closeSignupPrompt }}>
      {children}
    </SignupPromptContext.Provider>
  );
}

export function useSignupPrompt() {
  const ctx = useContext(SignupPromptContext);
  if (!ctx) throw new Error("useSignupPrompt must be used within SignupPromptProvider");
  return ctx;
}
