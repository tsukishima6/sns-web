"use client";

import Image from "next/image";

export default function FloatingAppPromo() {
  return (
    <>
      <style>{`
        @keyframes floatSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 999,
          width: "130px",
          height: "130px",
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
            fontSize="11"
            fill="#333"
            fontFamily="'Urbanist','Noto Sans JP',sans-serif"
            letterSpacing="1"
          >
            <textPath href="#floatTextCircle">
              アカウント作成はAppStore・GooglePlayから
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
    </>
  );
}
