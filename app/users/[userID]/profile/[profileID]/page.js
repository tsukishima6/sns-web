import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../../../../lib/firebase";
import Image from "next/image";
import Link from "next/link";
import PageHeader from "../../../../components/PageHeader";
import KaiwaiWordCloud from "../../../../components/wordcloud";
import EditProfileButton from "../../../../components/EditProfileButton";

// fallback画像
const fallbackProfilePhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";
const fallbackOGP =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwai_admin.png?alt=media&token=a3a36f2a-d37f-49fb-a3a6-0914f24131a8";

// 日付フォーマット関数
function formatDate(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}年${m}月${d}日 ${hh}:${mm}`;
}

// 動的メタデータ生成
export async function generateMetadata({ params }) {
  const { userID, profileID } = params;
  const profileRef = doc(db, "users", userID, "profile", profileID);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    return { title: "プロフィールが見つかりません | KAIWAI" };
  }

  const profile = profileSnap.data();

  // kaiwai の name を取得
  let kaiwaiName = "";
  let kaiwaiID = "";
  if (profile.kaiwai) {
    const kaiwaiSnap = await getDoc(profile.kaiwai);
    if (kaiwaiSnap.exists()) {
      kaiwaiName = kaiwaiSnap.data().name || "";
      kaiwaiID = kaiwaiSnap.id;
    }
  }

  return {
    title: `${profile.name || "ユーザー"}｜${kaiwaiName}kaiwai`,
    description: `${profile.name || "ユーザー"}のプロフィール`,
    openGraph: {
      title: `${profile.name || "ユーザー"}｜${kaiwaiName}kaiwai`,
      description: `${profile.name || "ユーザー"}のプロフィール`,
      images: [profile.photo || fallbackOGP],
    },
    twitter: {
      card: "summary_large_image",
      title: `${profile.name || "ユーザー"}｜${kaiwaiName}kaiwai`,
      description: `${profile.name || "ユーザー"}のプロフィール`,
      images: [profile.photo || fallbackOGP],
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ProfilePage({ params }) {
  const { userID, profileID } = params;

  // プロフィール取得
  const profileRef = doc(db, "users", userID, "profile", profileID);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    return <div style={{ padding: "2rem", fontSize: "1.5rem", color: "var(--fg-primary)" }}>プロフィールが見つかりません</div>;
  }

  const profile = profileSnap.data();

  // タグ（categories）の名前を取得
  let tags = [];
  if (profile.categories && profile.categories.length > 0) {
    tags = (
      await Promise.all(
        profile.categories.map(async (catRef) => {
          try {
            const catSnap = await getDoc(catRef);
            if (!catSnap.exists()) return null;
            return {
              id: catRef.id,
              kaiwaiID: catRef.parent.parent.id,
              name: catSnap.data().category_name || "",
            };
          } catch {
            return null;
          }
        })
      )
    ).filter(Boolean);
  }

  // kaiwai の name と id を取得（ヘッダー用）
  let kaiwaiName = "";
  let kaiwaiID = "";
  if (profile.kaiwai) {
    const kaiwaiSnap = await getDoc(profile.kaiwai);
    if (kaiwaiSnap.exists()) {
      kaiwaiName = kaiwaiSnap.data().name || "";
      kaiwaiID = kaiwaiSnap.id;
    }
  }

  // 投稿一覧を取得（このプロフィールと紐づく投稿）
  let posts = [];
  const postsRef = collection(db, "users", userID, "posts");
  const q = query(
    postsRef,
    where("postUser_profile", "==", profileRef),
    orderBy("timePosted", "desc")
  );
  const postsSnap = await getDocs(q);
  posts = postsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return (
    <>
      <PageHeader kaiwaiName={kaiwaiName} kaiwaiID={kaiwaiID} />

      {/* プロフィール本体 */}
      <div
        style={{
          marginTop: "9rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "0.8rem 1rem",
        }}
      >
        <img
          src={profile.photo || fallbackProfilePhoto}
          alt={profile.name || "ユーザー"}
          style={{ width: "150px", height: "150px", borderRadius: "50%", objectFit: "cover" }}
        />
        <h2 style={{ fontFamily: "Arial , Urbanist" , margin: "0.2rem", marginTop: "1.1rem", fontSize: "1.1rem", fontWeight: "500", textAlign: "center", color: "var(--fg-primary)" }}>
          {profile.name}
        </h2>
        <p style={{ fontFamily: "Urbanist", fontSize: "1.1rem", color: "var(--fg-secondary)", margin: "0rem 0", textAlign: "center" }}>
          @{profile.ID}
        </p>
        <p style={{ fontFamily: "Arial , Urbanist" , fontSize: "1rem", color: "var(--fg-secondary)", marginTop: "1.0rem", textAlign: "center" }}>
          {profile.bio && profile.bio.trim() !== "" ? profile.bio : "よろしくお願いします。"}
        </p>
        {tags.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "0.5rem",
              marginTop: "0.9rem",
            }}
          >
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/kaiwai/${tag.kaiwaiID}/category/${tag.id}`}
                style={{
                  fontSize: "0.8rem",
                  color: "var(--fg-secondary)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "999px",
                  padding: "0.3rem 0.8rem",
                  textDecoration: "none",
                  fontFamily: "Urbanist",
                }}
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
        <EditProfileButton userID={userID} />
      </div>

      {/* 投稿一覧 */}
      <div
        style={{
          maxWidth: "600px",
          margin: "2rem auto",
          padding: "0 0.8rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/posts/${userID}/${post.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{
                padding: "1.3rem",
                border: "1px solid var(--border-subtle)",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                backgroundColor: "var(--surface)",
                fontFamily: "Arial, sans-serif",
                position: "relative",
              }}
            >
              {/* 投稿者情報 */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
                <img
                  src={profile.photo || fallbackProfilePhoto}
                  alt={profile.name || "ユーザー"}
                  style={{
                    width: "52px",
                    height: "56px",
                    borderRadius: "50%",
                    marginRight: "0.75rem",
                    objectFit: "cover",
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: "500", fontSize: "0.9rem", color: "var(--fg-primary)" }}>
                    {profile.name}
                  </span>
                  <span style={{ fontSize: "0.9rem", color: "var(--fg-secondary)", fontFamily: "Urbanist" }}>
                    @{profile.ID || userID}
                  </span>
                </div>
              </div>

              {/* 投稿内容 */}
              <h4
                style={{
                  fontSize: "1rem",
                  fontWeight: "400",
                  marginBottom: post.postPhoto ? "1rem" : "2rem",
                  color: "var(--fg-primary)",
                }}
              >
                {post.postDescription}
              </h4>
              {post.postPhoto && (
                <img
                  src={post.postPhoto}
                  alt="投稿画像"
                  style={{ width: "100%", borderRadius: "8px", marginBottom: "1rem" }}
                />
              )}
              {post.postContent && (
                <p style={{ fontSize: "1rem", lineHeight: "1.6", color: "var(--fg-secondary)" }}>{post.postContent}</p>
              )}

              {/* 投稿日時 */}
              {post.timePosted && (
                <p
                  style={{
                    position: "absolute",
                    right: "1rem",
                    bottom: "0.6rem",
                    fontSize: "1.0rem",
                    color: "var(--fg-muted)",
                    fontFamily: "Urbanist",
                  }}
                >
                  {formatDate(post.timePosted)}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

{/* 🔻 ブランド紹介セクション */}
<div
  style={{
    width: "100vw",
    marginLeft: "calc(50% - 50vw)",
    marginTop: "0.5rem",
    backgroundImage:
      "url(https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwai_back.png?alt=media&token=e9b9293d-2a97-4b14-b4ee-c9b285e38372)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }}
>
  <div
    style={{
      backdropFilter: "blur(0px)",
      WebkitBackdropFilter: "blur(0px)",
      padding: "2.2rem 0",
    }}
  >
    <div
      style={{
        maxWidth: "720px",
        margin: "0 auto",
        padding: "0 1.4rem",
        textAlign: "left",
        color: "#152635",
      }}
    >
      <p style={{ margin: 0, fontSize: "1.0rem", lineHeight: "1.6", letterSpacing: "0.02em", fontFamily: "Noto Sans JP, Arial", color: "#152635" }}>
        界隈の数だけ、snsがあっていい。
      </p>
      <h2
        style={{
          margin: "0.4rem 0 1.1rem",
          fontSize: "2.5rem",
          fontWeight: 700,
          fontFamily: "'Urbanist','Montserrat',sans-serif",
          background: "linear-gradient(135deg, #152635, #8fa8a7)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          lineHeight: 1.1,
        }}
      >
        kaiwai
      </h2>
      <p style={{ margin: "0 0 0.9rem", fontSize: "0.90rem", lineHeight: "1.9", letterSpacing: "0.02em", fontFamily: "Noto Sans JP, Arial", whiteSpace: "pre-line" }}>
        趣味、地域、職種、悩み・・{"\n"}各界隈のユーザーが集う国産SNS。
      </p>
      <p style={{ margin: 0, fontSize: "0.90rem", lineHeight: "1.9", letterSpacing: "0.02em", fontFamily: "Noto Sans JP, Arial", whiteSpace: "pre-line" }}>
        {kaiwaiName}だけではありません。{"\n"}界隈は自由に追加・切り替え。{"\n"}ご自身で界隈を立ち上げ、{"\n"}メンバーを募ることも。
      </p>
    </div>
  </div>
</div>
<div style={{ marginTop: "0rem", marginBottom: "0rem" }}>
  <KaiwaiWordCloud />
</div>

    </>
  );
}
