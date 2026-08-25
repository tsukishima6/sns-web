"use client";

import Link from "next/link";
import { useSignupPrompt } from "@/lib/SignupPromptContext";

export default function SignupPromptDialog() {
  const { open, message, closeSignupPrompt } = useSignupPrompt();

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes signupPromptFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes signupPromptPopIn {
          from { opacity: 0; transform: translate(-50%, -50%) translateZ(0) scale(0.94); }
          to   { opacity: 1; transform: translate(-50%, -50%) translateZ(0) scale(1); }
        }
        .signup-prompt-mobile-break { display: none; }
        @media (max-width: 480px) {
          .signup-prompt-mobile-break { display: block; }
        }
      `}</style>

      {/* オーバーレイとカードはposition:fixedの兄弟にする(親子にしない)。fixedな祖先は
          必ず独自stacking contextを作りbackdrop-rootの境界になるため、カードを
          オーバーレイの子にするとカード自身のbackdrop-filterが実ページまで届かない
          (FloatingAppPromoのダイアログで判明した制約と同じ、CLAUDE.md参照) */}
      <div
        onClick={closeSignupPrompt}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 3000,
          backgroundColor: "rgba(21,38,53,0.35)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          isolation: "isolate",
          transform: "translateZ(0)",
          animation: "signupPromptFadeIn 0.2s ease forwards",
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="アカウントが必要です"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) translateZ(0)",
          zIndex: 3001,
          width: "85%",
          maxWidth: "340px",
          boxSizing: "border-box",
          padding: "1.75rem 1.5rem 1.5rem",
          borderRadius: "20px",
          background: "linear-gradient(135deg, rgba(21,38,53,0.55), rgba(143,168,167,0.5))",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          isolation: "isolate",
          border: "1px solid var(--card-border)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          animation: "signupPromptPopIn 0.25s ease forwards",
          textAlign: "center",
        }}
      >
        <button
          onClick={closeSignupPrompt}
          aria-label="閉じる"
          style={{
            position: "absolute",
            top: "0.75rem",
            right: "0.75rem",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            border: "none",
            background: "rgba(255,255,255,0.15)",
            color: "#fff",
            fontSize: "1rem",
            lineHeight: 1,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>

        <p
          style={{
            fontFamily: `"Hiragino Sans","ヒラギノ角ゴ ProN",sans-serif`,
            fontWeight: 700,
            fontSize: "1.05rem",
            color: "#fff",
            margin: "0 0 0.5rem",
          }}
        >
          アカウントが必要です
        </p>
        <p
          style={{
            fontFamily: `"Hiragino Sans","ヒラギノ角ゴ ProN",sans-serif`,
            fontSize: "0.85rem",
            color: "rgba(255,255,255,0.85)",
            margin: "0 0 1.5rem",
            lineHeight: 1.6,
          }}
        >
          {message || (
            <>
              この機能を利用するには、
              <br className="signup-prompt-mobile-break" />
              無料のアカウント登録が必要です。
            </>
          )}
        </p>

        <Link
          href="/signup"
          onClick={closeSignupPrompt}
          style={{
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            padding: "0.75rem",
            borderRadius: "14px",
            background: "#fff",
            color: "#152635",
            fontWeight: 700,
            fontSize: "0.95rem",
            textDecoration: "none",
            fontFamily: "'Urbanist', sans-serif",
            marginBottom: "0.6rem",
          }}
        >
          ブラウザではじめる
        </Link>

        <Link
          href="/login"
          onClick={closeSignupPrompt}
          style={{
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            padding: "0.7rem",
            borderRadius: "14px",
            border: "1px solid rgba(255,255,255,0.4)",
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.85rem",
            textDecoration: "none",
            fontFamily: "'Urbanist', sans-serif",
          }}
        >
          すでにアカウントをお持ちの方はログイン
        </Link>
      </div>
    </>
  );
}
