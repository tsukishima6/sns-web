"use client";

import Image from "next/image";
import { useState } from "react";

export default function FloatingAppPromo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <style>{`
        @keyframes floatSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 999,
          width: "130px",
          height: "130px",
          cursor: "pointer",
        }}
      >
        {/* 回転テキスト */}
        <svg
          viewBox="0 0 130 130"
          style={{
            position: "absolute",
            inset: 0,
            width: "130px",
            height: "130px",
            animation: "floatSpin 10s linear infinite",
          }}
        >
          <defs>
            <path
              id="floatTextCircle"
              d="M 65,65 m -52,0 a 52,52 0 1,1 104,0 a 52,52 0 1,1 -104,0"
            />
          </defs>
          <text
            fontSize="13"
            fill="#333"
            fontFamily="'Urbanist','Noto Sans JP',sans-serif"
            letterSpacing="1"
          >
            <textPath href="#floatTextCircle">
              <tspan fontSize="12">アカウント作成は</tspan><tspan fontSize="13">AppStore・GooglePlay</tspan><tspan fontSize="12">から</tspan>
            </textPath>
          </text>
        </svg>

        {/* 中央画像 */}
        <Image
          src="/iphone.png"
          alt="kaiwai app"
          width={80}
          height={80}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            objectFit: "contain",
          }}
        />
      </div>

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
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: "2.5rem",
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
                background: "linear-gradient(135deg, rgba(33,66,75,0.75), rgba(119,179,184,0.75))",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.3)",
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
                background: "linear-gradient(135deg, rgba(33,66,75,0.75), rgba(119,179,184,0.75))",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.3)",
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
                border: "1px solid rgba(150,150,150,0.4)",
                background: "rgba(180,180,180,0.6)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
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
