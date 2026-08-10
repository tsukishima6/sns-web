"use client";

import { useEffect, useRef, useState } from "react";

export default function FloatingAppPromo() {
  const [open, setOpen] = useState(false);
  const modelRef = useRef(null);

  // model-viewer はブラウザ専用のカスタム要素なのでクライアント側でのみ読み込む
  useEffect(() => {
    import("@google/model-viewer");
  }, []);

  // スクロール量に応じて自転させる。CSSのrotate3dでDOM要素そのものを回すと
  // （WebGLの描画結果を1枚の画像として回転させることになるため）90°付近で
  // 真横から見た状態になり紙のように薄く見えてしまう。model-viewerのcameraOrbit
  // で3Dカメラ自体をモデルの周りで回すと、常に立体として見える。
  // スニーカーは全方向に厚みがあるモデルなので、そのままフルスピンして良い
  useEffect(() => {
    let ticking = false;
    function updateOrbit() {
      const azimuth = window.scrollY * 0.5;
      const polar = 65 + Math.sin(window.scrollY * 0.006) * 25;
      const el = modelRef.current;
      if (el) {
        el.cameraOrbit = `${azimuth}deg ${polar}deg 105%`;
      }
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(updateOrbit);
        ticking = true;
      }
    }
    updateOrbit();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
          bottom: "76px",
          right: "1.5rem",
          zIndex: 999,
          width: "130px",
          height: "130px",
          cursor: "pointer",
          perspective: "400px",
        }}
      >
        {/* 中央: 3Dモデル（テキストより奥） */}
        {/* eslint-disable-next-line react/no-unknown-property */}
        <model-viewer
          ref={modelRef}
          src="https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/sneaker.glb?alt=media&token=05b056e7-24ad-4419-bc4a-78ab0432bd52"
          disable-zoom
          interaction-prompt="none"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "104px",
            height: "104px",
            zIndex: 1,
            pointerEvents: "none",
            "--poster-color": "transparent",
            backgroundColor: "transparent",
          }}
        />

        {/* 回転テキスト（3Dモデルより手前） */}
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
            fill="#333"
            fontFamily="'Urbanist','Noto Sans JP',sans-serif"
            letterSpacing="1"
          >
            <textPath href="#floatTextCircle">
              <tspan fontSize="12">アカウント作成は</tspan><tspan fontSize="13">AppStore・GooglePlay</tspan><tspan fontSize="12">から</tspan>
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
            paddingBottom: "20vh",
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
