// src/components/Header.js
import Image from "next/image";

export default function Header({ kaiwaiName }) {
  return (
    <header
      style={{
        width: "100%",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        backgroundColor: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        padding: "0.5rem 1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontFamily: "'Urbanist','Montserrat',sans-serif",
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <Image
          src="https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwailogo.png?alt=media&token=9cea2404-8c0c-466e-b69f-091715e423ad"
          alt="KAIWAI Logo"
          width={34}
          height={34}
          style={{ objectFit: "contain" }}
        />
      </div>
      <h1 style={{ display: "flex", alignItems: "baseline", gap: "0.2rem" }}>
        <span style={{ fontSize: "1.2rem", fontWeight: "600", color: "#222" }}>
          {kaiwaiName}
        </span>
        <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "#222" }}>
          kaiwai
        </span>
      </h1>
      <div style={{ display: "flex", gap: "0.25rem" }}>
        <a
          href="https://apps.apple.com/jp/app/kaiwai/id6469412765"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/apple.svg"
            alt="App Store"
            width={56}
            height={56}
            style={{ width: 28, height: 28 }}
          />
        </a>
        <a
          href="https://play.google.com/store/apps/details?id=com.flutterflow.tsukishima6"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="/googleplay.svg"
            alt="Google Play"
            width={56}
            height={56}
            style={{ width: 28, height: 28 }}
          />
        </a>
      </div>
    </header>
  );
}
