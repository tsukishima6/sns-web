import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";

// fallback画像
const fallbackProfilePhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";
const fallbackOGP =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwai_admin.png?alt=media&token=a3a36f2a-d37f-49fb-a3a6-0914f24131a8";

// 動的メタデータ生成（OGP用）
export async function generateMetadata({ params }) {
  const { userID, postID } = params;
  const postRef = doc(db, "users", userID, "posts", postID);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) {
    return { title: "投稿が見つかりません | KAIWAI" };
  }

  const post = postSnap.data();
  const ogImage = post.postPhoto || fallbackOGP;

  // 投稿者プロフィール取得
  let profileData = null;
  if (post.postUser_profile) {
    const profileSnap = await getDoc(post.postUser_profile);
    if (profileSnap.exists()) {
      profileData = profileSnap.data();
    }
  }

  // kaiwai の name を取得
  let kaiwaiName = "";
  if (post.kaiwai) {
    const kaiwaiSnap = await getDoc(post.kaiwai);
    if (kaiwaiSnap.exists()) {
      kaiwaiName = kaiwaiSnap.data().name || "";
    }
  }

  // description をカスタマイズ
  const description =
    `${profileData?.name || "ユーザー"}：${post.postDescription || ""} @${kaiwaiName}kaiwai`;

  return {
    title: post.postDescription || "KAIWAI 投稿",
    description,
    openGraph: {
      title: post.postDescription || "KAIWAI 投稿",
      description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: post.postDescription || "KAIWAI 投稿",
      description,
      images: [ogImage],
    },
  };
}

export default async function PostPage({ params }) {
  const { userID, postID } = params;

  // 投稿取得
  const postRef = doc(db, "users", userID, "posts", postID);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) {
    return (
      <div style={{ padding: "2rem", fontSize: "1.5rem" }}>
        投稿が見つかりません
      </div>
    );
  }

  const post = postSnap.data();

  // 投稿者プロフィール取得
  let profileData = null;
  if (post.postUser_profile) {
    const profileSnap = await getDoc(post.postUser_profile);
    if (profileSnap.exists()) {
      profileData = profileSnap.data();
    }
  }

  // kaiwai の name を取得
  let kaiwaiName = "";
  if (post.kaiwai) {
    const kaiwaiSnap = await getDoc(post.kaiwai);
    if (kaiwaiSnap.exists()) {
      kaiwaiName = kaiwaiSnap.data().name || "";
    }
  }

  // 投稿日時フォーマット関数
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${y}年${m}月${d}日 ${h}:${min}`;
  };

  // 他の投稿を取得
  let otherPosts = [];
  if (profileData && post.postUser_profile) {
    const userPostsRef = collection(db, "users", userID, "posts");
    const q = query(
      userPostsRef,
      where("postUser_profile", "==", post.postUser_profile),
      orderBy("timePosted", "desc")
    );
    const otherPostsSnap = await getDocs(q);
    otherPosts = otherPostsSnap.docs
      .filter((doc) => doc.id !== postID) // 今の投稿を除外
      .map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  return (
    <>
      {/* ヘッダー */}
      <header
        style={{
          maxWidth: "960px",
          margin: "0.5rem auto 0.2rem",
          padding: "0 0.8rem",
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
            width={36}
            height={36}
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
          <a href="https://apps.apple.com/jp/app/kaiwai/id6469412765" target="_blank" rel="noopener noreferrer">
            <Image
  src="/apple.svg"
  alt="App Store"
  width={56} // ← 実際に表示したい大きさの2倍
  height={56}
  style={{ width: 28, height: 28 }} // ← 表示サイズは小さく
/>
          </a>
          <a href="https://play.google.com/store/apps/details?id=com.flutterflow.tsukishima6" target="_blank" rel="noopener noreferrer">
            <Image
  src="/googleplay.svg"
  alt="App Store"
  width={56} // ← 実際に表示したい大きさの2倍
  height={56}
  style={{ width: 28, height: 28 }} // ← 表示サイズは小さく
/>
          </a>
        </div>
      </header>

      {/* メイン投稿カード */}
      <div
        style={{
          maxWidth: "600px",
          margin: "0.2rem auto",
          marginRight: "0.6rem",
          marginLeft: "0.6rem",
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
        {profileData && (
          <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
            <img
              src={profileData.photo || fallbackProfilePhoto}
              alt={profileData.name || "ユーザー"}
              style={{
                width: "44px",
                height: "50px",
                borderRadius: "50%",
                marginRight: "0.75rem",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: "500", fontSize: "1.0rem", color: "#333"  }}>
                {profileData.name}
              </span>
              <span style={{ fontSize: "0.9rem", color: "#666" ,fontFamily: "Urbanist"}}>
                @{profileData.ID || userID}
              </span>
            </div>
          </div>
        )}

        {/* 投稿タイトル */}
        <h1
          style={{
            fontSize: "1.0rem",
            fontWeight: "300",
            marginBottom: post.postPhoto ? "1rem" : "2.2rem",
            color: "#333",
          }}
        >
          {post.postDescription}
        </h1>

        {/* 投稿写真 */}
        {post.postPhoto && (
          <img
            src={post.postPhoto}
            alt="投稿画像"
            style={{ width: "100%", borderRadius: "8px", marginBottom: "1.5rem" }}
          />
        )}

        {/* 投稿本文 */}
        {post.postContent && (
          <p style={{ fontSize: "1.2rem", lineHeight: "1.6", color: "#555" }}>
            {post.postContent}
          </p>
        )}

        {/* 投稿日時 */}
        {post.timePosted && (
          <div
            style={{
              position: "absolute",
              bottom: "1.5rem",
              right: "1.8em",
              fontSize: "0.95rem",
              color: "#888",
              fontFamily: "'Urbanist','Montserrat',sans-serif",
            }}
          >
            {formatTime(post.timePosted)}
          </div>
        )}
      </div>

      {/* 他の投稿 */}
      {profileData && (
        <div
          style={{
            maxWidth: "600px",
            margin: "2rem auto",
            padding: "0 0.8rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem" }}>
            <img
              src={profileData.photo || fallbackProfilePhoto}
              alt={profileData.name || "ユーザー"}
              style={{
                width: "38px",
                height: "42px",
                borderRadius: "50%",
                marginRight: "0.6rem",
              }}
            />
            <h3 style={{ fontSize: "1.0rem", fontWeight: "500", margin: 0, color: "#222", fontFamily: "Arial, sans-serif" }}>
              {profileData.name} の他の投稿
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {otherPosts.map((other, idx) => {
              let formattedOtherTime = "";
              if (other.timePosted) {
                const date = other.timePosted.toDate();
                const y = date.getFullYear();
                const m = date.getMonth() + 1;
                const d = date.getDate();
                const h = String(date.getHours()).padStart(2, "0");
                const min = String(date.getMinutes()).padStart(2, "0");
                formattedOtherTime = `${y}年${m}月${d}日 ${h}:${min}`;
              }

              return (
                <div
                  key={idx}
                  style={{
                    padding: "1rem",
                    paddingTop: "0rem",
                    border: "1px solid #ddd",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                    backgroundColor: "#fff",
                    position: "relative",
                  }}
                >
                  <h4 style={{ fontSize: "1rem", fontWeight: "400", marginBottom: other.postPhoto ? "1rem" : "2rem", color: "#333", fontFamily: "'Urbanist','Montserrat',sans-serif" }}>
                    {other.postDescription}
                  </h4>
                  {other.postPhoto && (
                    <img
                      src={other.postPhoto}
                      alt="投稿画像"
                      style={{ width: "100%", borderRadius: "8px", marginBottom: "1rem" }}
                    />
                  )}
                  {other.postContent && (
                    <p style={{ fontSize: "1rem", lineHeight: "1.6", color: "#555" }}>
                      {other.postContent}
                    </p>
                  )}
                  {formattedOtherTime && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "1rem",
                        right: "1.2rem",
                        fontSize: "0.9rem",
                        color: "#888",
                        fontFamily: "'Urbanist','Montserrat',sans-serif",
                      }}
                    >
                      {formattedOtherTime}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
