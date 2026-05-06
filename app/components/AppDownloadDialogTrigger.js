"use client";

import { useState } from "react";

export default function AppDownloadDialogTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* トリガー部分：青文字＋アンダーライン */}
      <span
        onClick={() => setOpen(true)}
        style={{
          color: "#1E88E5",
          textDecoration: "underline",
          cursor: "pointer",
          fontFamily: `"Urbanist","Hiragino Sans","ヒラギノ角ゴ ProN",sans-serif`,
        }}
      >
        kaiwaiアプリ
      </span>

      {/* ダイアログ */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: "15vh",
            zIndex: 2000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              width: "85%",
              maxWidth: "300px",
              marginBottom: "0",
              animation: "slideUp 0.35s ease forwards",
            }}
          >
            {/* App Store */}
            <a
              href="https://apps.apple.com/jp/app/kaiwai-%E7%95%8C%E9%9A%88%E3%83%81%E3%83%A3%E3%83%83%E3%83%88sns/id6469412765"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                background: "linear-gradient(135deg, rgba(33,66,75,0.5), rgba(119,179,184,0.45))",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: "0 8px 32px rgba(33,66,75,0.25), inset 0 1px 0 rgba(255,255,255,0.25)",
                border: "none",
                color: "#fff",
                padding: "13px 15px",
                borderRadius: "16px",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "1rem",
                fontFamily: "'Urbanist', sans-serif",
                textAlign: "center",
              }}
            >
              App Store
            </a>

            {/* Google Play */}
            <a
              href="https://play.google.com/store/apps/details?id=com.flutterflow.tsukishima6"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                background: "linear-gradient(135deg, rgba(33,66,75,0.5), rgba(119,179,184,0.45))",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: "0 8px 32px rgba(33,66,75,0.25), inset 0 1px 0 rgba(255,255,255,0.25)",
                border: "none",
                color: "#fff",
                padding: "13px 15px",
                borderRadius: "16px",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "1rem",
                fontFamily: "'Urbanist', sans-serif",
                textAlign: "center",
              }}
            >
              Google Play
            </a>

            {/* 閉じる */}
            <button
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                width: "100%",
                padding: "11px",
                borderRadius: "16px",
                border: "none",
                background: "rgba(200,200,200,0.4)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.4)",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontFamily: `"Hiragino Sans","ヒラギノ角ゴ ProN",sans-serif`,
                color: "#444",
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
