import {
  doc,
  getDoc,
  collectionGroup,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../../../lib/firebase";
import Link from "next/link";
import PageHeader from "../../../../components/PageHeader";

const fallbackProfilePhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";

export async function generateMetadata({ params }) {
  const { kaiwaiID, categoryID } = params;
  const categorySnap = await getDoc(doc(db, "kaiwai", kaiwaiID, "category", categoryID));

  if (!categorySnap.exists()) {
    return { title: "タグが見つかりません｜kaiwai", robots: { index: false, follow: false } };
  }

  const category = categorySnap.data();
  return {
    title: `#${category.category_name}｜kaiwai`,
    robots: { index: false, follow: false },
  };
}

export default async function CategoryPage({ params }) {
  const { kaiwaiID, categoryID } = params;

  const kaiwaiRef = doc(db, "kaiwai", kaiwaiID);
  const categoryRef = doc(db, "kaiwai", kaiwaiID, "category", categoryID);

  const [kaiwaiSnap, categorySnap] = await Promise.all([
    getDoc(kaiwaiRef),
    getDoc(categoryRef),
  ]);

  if (!categorySnap.exists()) {
    return <div style={{ padding: "2rem", fontSize: "1.5rem", color: "var(--fg-primary)" }}>タグが見つかりません</div>;
  }

  const category = categorySnap.data();
  const kaiwaiName = kaiwaiSnap.exists() ? kaiwaiSnap.data().name : "";

  let profiles = [];
  try {
    const q = query(collectionGroup(db, "profile"), where("categories", "array-contains", categoryRef));
    const snap = await getDocs(q);
    profiles = await Promise.all(
      snap.docs.map(async (d) => {
        const userID = d.ref.parent.parent ? d.ref.parent.parent.id : null;
        const data = d.data();

        // このタグ以外のタグを最大2件表示（ネイティブのA_Hashtagに合わせる）
        const otherCategoryRefs = (data.categories || [])
          .filter((c) => c.path !== categoryRef.path)
          .slice(0, 2);
        const otherTags = (
          await Promise.all(
            otherCategoryRefs.map(async (c) => {
              try {
                const s = await getDoc(c);
                return s.exists() ? s.data().category_name : null;
              } catch {
                return null;
              }
            })
          )
        ).filter(Boolean);

        return { id: d.id, userID, otherTags, ...data };
      })
    );
  } catch (err) {
    console.error("category profiles fetch error:", err);
  }

  return (
    <>
      <PageHeader kaiwaiName={kaiwaiName} kaiwaiID={kaiwaiID} />

      <div
        style={{
          fontFamily: "'Noto Sans JP', 'Urbanist', sans-serif",
          maxWidth: "720px",
          margin: "0 auto",
          paddingTop: "7.4rem",
          padding: "7.4rem 1rem 3rem",
        }}
      >
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 600,
            margin: "0 0 0.3rem",
            fontFamily: "'Urbanist','Montserrat',sans-serif",
            background: "linear-gradient(135deg, #152635, #8fa8a7)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          #{category.category_name}
        </h1>
        <p style={{ fontSize: "0.85rem", color: "var(--fg-secondary)", marginBottom: "2rem" }}>
          このタグを付けているユーザー
        </p>

        {profiles.length === 0 ? (
          <p style={{ color: "var(--fg-muted)" }}>まだこのタグを付けているユーザーがいません</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            {profiles.map((profile) => (
              <Link
                key={profile.id}
                href={`/users/${profile.userID}/profile/${profile.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.9rem",
                  padding: "0.8rem 0.4rem",
                  textDecoration: "none",
                  color: "inherit",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.9rem", minWidth: 0 }}>
                  <img
                    src={profile.photo || fallbackProfilePhoto}
                    alt={profile.name || "ユーザー"}
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                    <span style={{ fontWeight: 500, fontSize: "0.9rem", color: "var(--fg-primary)" }}>
                      {profile.name}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "var(--fg-secondary)", fontFamily: "Urbanist" }}>
                      @{profile.ID || profile.userID}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "0.2rem",
                    maxWidth: "45%",
                    flexShrink: 0,
                  }}
                >
                  {profile.otherTags && profile.otherTags.length > 0 && (
                    <span style={{ fontSize: "0.75rem", color: "#8fa8a7", fontFamily: "Urbanist" }}>
                      {profile.otherTags.map((t) => `#${t}`).join(" ")}
                    </span>
                  )}
                  {profile.bio && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--fg-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "100%",
                      }}
                    >
                      {profile.bio}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
