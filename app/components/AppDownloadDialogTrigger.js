"use client";

import { useState } from "react";

export default function AppDownloadDialogTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* トリガー部分：青文字＋アンダーライン */}
      <span
        onClick={() => setOpen(true)}
        style={{
          color: "#1E88E5",
          textDecoration: "underline",
          cursor: "pointer",
          fontFamily: `"Hiragino Sans","ヒラギノ角ゴ ProN",sans-serif`,
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
            backgroundColor: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(3px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "16px",
              padding: "28px 25px",
              boxShadow: "0 4px 25px rgba(0,0,0,0.15)",
              textAlign: "center",
              position: "relative",
              width: "85%",
              maxWidth: "320px",
              fontFamily: `"Hiragino Sans","ヒラギノ角ゴ ProN",sans-serif`,
              marginBottom: "100px",
            }}
          >

            {/* App Store */}
            <a
              href="https://apps.apple.com/jp/app/kaiwai-%E7%95%8C%E9%9A%88%E3%83%81%E3%83%A3%E3%83%83%E3%83%88sns/id6469412765"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                background: "linear-gradient(135deg,#21424b,#77b3b8)",
                color: "#fff",
                padding: "11px 15px",
                borderRadius: "16px",
                marginBottom: "13px",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "1rem",
                fontFamily: "'Urbanist', sans-serif",
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
                background: "linear-gradient(135deg,#21424b,#77b3b8)",
                color: "#fff",
                padding: "11px 15px",
                borderRadius: "16px",
                marginBottom: "13px",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "1rem",
                fontFamily: "'Urbanist', sans-serif",
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
                padding: "10px",
                borderRadius: "16px",
                border: "1px solid #ccc",
                background: "white",
                cursor: "pointer",
                fontSize: "0.9rem",
                marginTop: "4px",
                fontFamily: `"Hiragino Sans","ヒラギノ角ゴ ProN",sans-serif`,
                color: "#3f3f3f",
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
