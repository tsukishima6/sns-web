"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function FloatingAppPromo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <style>{`
        @keyframes floatSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes floatBob {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-6px); }
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
          bottom: "76px",
          right: "1.5rem",
          zIndex: 999,
          width: "130px",
          height: "130px",
          cursor: "pointer",
        }}
      >
        {/* 中央: ロゴ（テキストより奥）。以前は3Dスニーカーモデル(model-viewer)
            だったが、パフォーマンス実測でLCP/TBTを大きく悪化させていたため撤去 */}
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwailogo.png?alt=media&token=9cea2404-8c0c-466e-b69f-091715e423ad"
          alt="KAIWAI"
          width={72}
          height={72}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 1,
            pointerEvents: "none",
            objectFit: "contain",
            animation: "floatBob 3s ease-in-out infinite",
          }}
        />

        {/* 回転テキスト（ロゴより手前） */}
        <svg
          viewBox="0 0 130 130"
          style={{
            position: "absolute",
            inset: 0,
            width: "130px",
            height: "130px",
            zIndex: 2,
            pointerEvents: "none",
            overflow: "visible",
            animation: "floatSpin 10s linear infinite",
          }}
        >
          <defs>
            <path
              id="floatTextCircle"
              d="M 65,65 m -50,0 a 50,50 0 1,1 100,0 a 50,50 0 1,1 -100,0"
            />
          </defs>
          <text
            fontSize="13"
            fill="var(--fg-primary)"
            fontFamily="'Urbanist','Noto Sans JP',sans-serif"
            letterSpacing="1"
          >
            <textPath href="#floatTextCircle">
              <tspan fontSize="13">AppStore・GooglePlay・</tspan><tspan fontSize="12">ブラウザでサインアップ</tspan>
            </textPath>
          </text>
        </svg>
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
            alignItems: "center",
            justifyContent: "center",
            paddingTop: "10vh",
            zIndex: 2000,
            isolation: "isolate",
            transform: "translateZ(0)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              width: "85%",
              maxWidth: "300px",
              marginBottom: "0",
              animation: "slideUp 0.35s ease forwards",
              isolation: "isolate",
              transform: "translateZ(0)",
            }}
          >
            {/* App Store */}
            <a
              href="https://apps.apple.com/jp/app/kaiwai-%E7%95%8C%E9%9A%88%E3%83%81%E3%83%A3%E3%83%83%E3%83%88sns/id6469412765"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                background: "linear-gradient(135deg, rgba(21,38,53,0.5), rgba(143,168,167,0.45))",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                isolation: "isolate",
                transform: "translateZ(0)",
                border: "1px solid var(--card-border)",
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
                background: "linear-gradient(135deg, rgba(21,38,53,0.5), rgba(143,168,167,0.45))",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                isolation: "isolate",
                transform: "translateZ(0)",
                border: "1px solid var(--card-border)",
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

            {/* ブラウザでサインアップ */}
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                background: "linear-gradient(135deg, rgba(21,38,53,0.5), rgba(143,168,167,0.45))",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                isolation: "isolate",
                transform: "translateZ(0)",
                border: "1px solid var(--card-border)",
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
              ブラウザでサインアップ
            </Link>

            {/* 閉じる */}
            <button
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                width: "100%",
                padding: "11px",
                borderRadius: "16px",
                border: "1px solid var(--card-border)",
                background: "var(--card-bg)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                isolation: "isolate",
                transform: "translateZ(0)",
                appearance: "none",
                WebkitAppearance: "none",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontFamily: `"Hiragino Sans","ヒラギノ角ゴ ProN",sans-serif`,
                color: "var(--fg-primary)",
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
