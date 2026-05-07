import Image from "next/image";
import Link from "next/link";

export default function PageHeader({ kaiwaiName, kaiwaiID }) {
  return (
    <header
      style={{
        width: "100%",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          padding: "0.8rem 1rem",
          paddingTop: "1.2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "'Urbanist','Montserrat',sans-serif",
        }}
      >
        {/* ロゴ */}
        <div style={{ flexShrink: 0 }}>
          <Link href="https://kaiwai.vercel.app/" style={{ display: "inline-block" }}>
            <Image
              src="https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwailogo.png?alt=media&token=9cea2404-8c0c-466e-b69f-091715e423ad"
              alt="KAIWAI Logo"
              width={34}
              height={34}
              style={{ objectFit: "contain", cursor: "pointer" }}
            />
          </Link>
        </div>

        {/* タイトル */}
        <Link href={`/kaiwai/${kaiwaiID}`} style={{ textDecoration: "none", color: "inherit" }}>
          <h1
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 0,
              margin: 0,
              marginLeft: "1rem",
              fontFamily: "'Urbanist','Montserrat',sans-serif",
            }}
          >
            <span
              style={{
                fontSize: "1.0rem",
                fontWeight: "600",
                color: "#222",
                lineHeight: "1",
                paddingBottom: "0.7rem",
              }}
            >
              {kaiwaiName}<ruby style={{ rubyAlign: "center" }}>界隈<rt style={{ fontSize: "0.75rem", fontWeight: "400", color: "#555", letterSpacing: "0.05em" }}>kaiwai</rt></ruby>
            </span>
            <div
              style={{
                background: "linear-gradient(135deg, #152635, #8fa8a7)",
                color: "#fff",
                borderRadius: "26px",
                padding: "0.3rem 0.6rem",
                fontSize: "0.9rem",
                fontWeight: "500",
                marginLeft: "0.3rem",
                lineHeight: "1",
                transform: "translateY(-5px)",
              }}
            >
              web版
            </div>
          </h1>
        </Link>

        {/* アプリDLボタン */}
        <div style={{ display: "flex", gap: "0.25rem" }}>
          <a
            href="https://apps.apple.com/jp/app/kaiwai/id6469412765"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/ap.png"
              alt="App Store"
              width={28}
              height={28}
              style={{ objectFit: "contain" }}
            />
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.flutterflow.tsukishima6"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/gp.png"
              alt="Google Play"
              width={28}
              height={28}
              style={{ objectFit: "contain" }}
            />
          </a>
        </div>
      </div>
    </header>
  );
}
