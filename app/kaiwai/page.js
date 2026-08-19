import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import Link from "next/link";
import KaiwaiSelectLink from "../components/KaiwaiSelectLink";

export const metadata = {
  title: "界隈一覧｜kaiwai",
  description:
    "kaiwaiに参加できる界隈の一覧です。趣味・地域・職種など、あなたにぴったりの界隈を見つけよう。",
};

const fallbackImage =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwai_admin.png?alt=media&token=a3a36f2a-d37f-49fb-a3a6-0914f24131a8";

async function fetchKaiwaiList() {
  try {
    const q = query(collection(db, "kaiwai"), orderBy("number", "desc"));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((k) => !k.closed && !k.noindex);
  } catch (err) {
    console.error("kaiwai list fetch error:", err);
    return [];
  }
}

export default async function KaiwaiListPage() {
  const kaiwaiList = await fetchKaiwaiList();

  // カテゴリでグルーピング
  const hobby = kaiwaiList.filter((k) => k.hobbies);
  const local = kaiwaiList.filter((k) => k.local);
  const alumni = kaiwaiList.filter((k) => k.alumni);
  const other = kaiwaiList.filter((k) => !k.hobbies && !k.local && !k.alumni);

  const sections = [
    { label: "趣味", list: hobby },
    { label: "地域", list: local },
    { label: "同窓・OB", list: alumni },
    { label: "その他", list: other },
  ].filter((s) => s.list.length > 0);

  return (
    <div
      style={{
        maxWidth: "720px",
        margin: "0 auto",
        padding: "1.5rem 1rem 3rem",
        fontFamily: "'Noto Sans JP', 'Urbanist', sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          marginBottom: "0.3rem",
          fontFamily: "'Urbanist', 'Montserrat', sans-serif",
          background: "linear-gradient(135deg, #152635, #8fa8a7)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        界隈を探す
      </h1>
      <p
        style={{
          fontSize: "0.85rem",
          color: "var(--fg-secondary)",
          marginBottom: "1.2rem",
        }}
      >
        気になる界隈をタップして参加しよう。
      </p>

      <Link
        href="/kaiwai/new"
        style={{
          display: "inline-block",
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "#152635",
          border: "1px solid #152635",
          borderRadius: "999px",
          padding: "0.5rem 1.1rem",
          marginBottom: "2rem",
          textDecoration: "none",
        }}
      >
        ＋ 界隈をつくる
      </Link>

      {kaiwaiList.length === 0 ? (
        <p style={{ color: "var(--fg-muted)" }}>界隈が見つかりませんでした。</p>
      ) : sections.length > 0 ? (
        sections.map((section) => (
          <section key={section.label} style={{ marginBottom: "2rem" }}>
            <h2
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#8fa8a7",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "0.75rem",
                fontFamily: "'Urbanist', sans-serif",
                borderBottom: "1px solid var(--border-subtle)",
                paddingBottom: "0.4rem",
              }}
            >
              {section.label}
            </h2>
            <KaiwaiGrid list={section.list} />
          </section>
        ))
      ) : (
        <KaiwaiGrid list={kaiwaiList} />
      )}
    </div>
  );
}

function KaiwaiGrid({ list }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "0.75rem",
      }}
    >
      {list.map((k) => (
        <KaiwaiCard key={k.id} kaiwai={k} />
      ))}
    </div>
  );
}

function KaiwaiCard({ kaiwai }) {
  return (
    <KaiwaiSelectLink
      kaiwaiId={kaiwai.id}
      kaiwaiName={kaiwai.name}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div
        style={{
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid var(--border-subtle)",
          background: "var(--surface)",
          transition: "box-shadow 0.15s",
        }}
      >
        {/* カバー画像 */}
        <div style={{ position: "relative", width: "100%", paddingTop: "56.25%" }}>
          <img
            src={kaiwai.image || fallbackImage}
            alt={kaiwai.name}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>

        {/* 情報 */}
        <div style={{ padding: "0.7rem 0.8rem 0.8rem" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.3rem", marginBottom: "0.2rem" }}>
            <span
              style={{
                fontSize: "0.95rem",
                fontWeight: 600,
                color: "var(--fg-primary)",
                fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
              }}
            >
              {kaiwai.name}
            </span>
          </div>

          {kaiwai.name_english && (
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--fg-muted)",
                fontFamily: "'Urbanist', sans-serif",
                marginBottom: "0.35rem",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {kaiwai.name_english}
            </div>
          )}

          {kaiwai.description && (
            <p
              style={{
                fontSize: "0.78rem",
                color: "var(--fg-secondary)",
                margin: "0 0 0.4rem",
                lineHeight: "1.45",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {kaiwai.description}
            </p>
          )}

          <div
            style={{
              fontSize: "0.75rem",
              color: "#8fa8a7",
              fontFamily: "'Urbanist', sans-serif",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            {kaiwai.number || 0}人
          </div>
        </div>
      </div>
    </KaiwaiSelectLink>
  );
}
