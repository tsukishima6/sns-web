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
        }}
      >
        kaiwaiアプリ
      </span>

      {/* おしゃれダイアログ */}
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
              borderRadius: "14px",
              padding: "28px 36px",
              boxShadow: "0 4px 25px rgba(0,0,0,0.15)",
              textAlign: "center",
              position: "relative",
              width: "320px",
            }}
          >
            <h3
              style={{
                marginBottom: "18px",
                fontWeight: "500",
                fontSize: "1.1rem",
              }}
            >
              アプリで快適に利用できます！
            </h3>

            <a
              href="https://apps.apple.com/jp/app/kaiwai-%E7%95%8C%E9%9A%88%E3%83%81%E3%83%A3%E3%83%83%E3%83%88sns/id6469412765"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                background: "#000",
                color: "#fff",
                padding: "10px 15px",
                borderRadius: "8px",
                marginBottom: "12px",
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              App Store
            </a>

            <a
              href="https://play.google.com/store/apps/details?id=com.flutterflow.tsukishima6"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                background: "#34A853",
                color: "#fff",
                padding: "10px 15px",
                borderRadius: "8px",
                marginBottom: "12px",
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              Google Play
            </a>

            <button
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                width: "100%",
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                background: "white",
                cursor: "pointer",
                fontSize: "0.9rem",
                marginTop: "4px",
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
