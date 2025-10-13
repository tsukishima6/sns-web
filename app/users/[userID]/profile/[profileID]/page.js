import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import Image from "next/image";
import Link from "next/link";

// fallback画像
const fallbackProfilePhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";
const fallbackOGP =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwai_admin.png?alt=media&token=a3a36f2a-d37f-49fb-a3a6-0914f24131a8";

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
  if (profile.kaiwai) {
    const kaiwaiSnap = await getDoc(profile.kaiwai);
    if (kaiwaiSnap.exists()) {
      kaiwaiName = kaiwaiSnap.data().name || "";
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
  };
}

export default async function ProfilePage({ params }) {
  const { userID, profileID } = params;

  // プロフィール取得
  const profileRef = doc(db, "users", userID, "profile", profileID);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    return <div style={{ padding: "2rem", fontSize: "1.5rem" }}>プロフィールが見つかりません</div>;
  }

  const profile = profileSnap.data();

  // kaiwai の name を取得（ヘッダー用）
  let kaiwaiName = "";
  if (profile.kaiwai) {
    const kaiwaiSnap = await getDoc(profile.kaiwai);
    if (kaiwaiSnap.exists()) {
      kaiwaiName = kaiwaiSnap.data().name || "";
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
      {/* 固定ヘッダー（投稿ページと同じ） */}
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
          <div style={{ flexShrink: 0 }}>
            <Image
              src="https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwailogo.png?alt=media&token=9cea2404-8c0c-466e-b69f-091715e423ad"
              alt="KAIWAI Logo"
              width={34}
              height={34}
              style={{ objectFit: "contain" }}
            />
          </div>
          <h1 style={{ display: "flex", alignItems: "baseline", gap: "0.2rem", margin: 0 }}>
            <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "#222" }}>
              {kaiwaiName}
            </span>
            <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "#222" }}>
              kaiwai
            </span>
          </h1>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            <a href="https://apps.apple.com/jp/app/kaiwai/id6469412765" target="_blank" rel="noopener noreferrer">
              <img src="/apple.svg" alt="App Store" width={56} height={56} style={{ width: 28, height: 28 }} />
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.flutterflow.tsukishima6" target="_blank" rel="noopener noreferrer">
              <img src="/googleplay.svg" alt="Google Play" width={56} height={56} style={{ width: 28, height: 28 }} />
            </a>
          </div>
        </div>
      </header>

      {/* プロフィール本体 */}
      <div
        style={{
          marginTop: "6rem", // ヘッダー分
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "2rem 1rem",
        }}
      >
        <img
          src={profile.photo || fallbackProfilePhoto}
          alt={profile.name || "ユーザー"}
          style={{ width: "150px", height: "150px", borderRadius: "50%", objectFit: "cover" }}
        />
        <h2 style={{ margin: "0.2rem", marginTop: "1.4rem", fontSize: "1.1rem", fontWeight: "500", textAlign: "center" }}>
          {profile.name}
        </h2>
        <p style={{ fontFamily: "Urbanist", fontSize: "1.1rem", color: "#666", margin: "0.3rem 0", textAlign: "center" }}>
          @{profile.ID}
        </p>
        <p style={{ fontSize: "1rem", color: "#444", margin: "0.2rem 0", textAlign: "center" }}>
          {profile.bio && profile.bio.trim() !== "" ? profile.bio : "よろしくお願いします。"}
        </p>
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
                border: "1px solid #ddd",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                backgroundColor: "#fff",
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
                    width: "50px",
                    height: "54px",
                    borderRadius: "50%",
                    marginRight: "0.75rem",
                    objectFit: "cover",
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: "500", fontSize: "1.0rem", color: "#333" }}>
                    {profile.name}
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "#666", fontFamily: "Urbanist" }}>
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
                  color: "#333",
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
                <p style={{ fontSize: "1rem", lineHeight: "1.6", color: "#555" }}>{post.postContent}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
