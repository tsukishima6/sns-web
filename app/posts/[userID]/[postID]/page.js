import { doc, getDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import Image from "next/image";
import Link from "next/link";
import PageHeader from "../../../components/PageHeader";

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
  let profileID = "";
  if (post.postUser_profile) {
    const profileSnap = await getDoc(post.postUser_profile);
    if (profileSnap.exists()) {
      profileData = profileSnap.data();
      profileID = post.postUser_profile.id; // ← profileID取得
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
    robots: post.postDescription?.includes("に参加しました！よろしくお願いします。")
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export default async function PostPage({ params }) {
  const { userID, postID } = params;

  // 投稿取得
  const postRef = doc(db, "users", userID, "posts", postID);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) {
    return <div style={{ padding: "2rem", fontSize: "1.5rem" }}>投稿が見つかりません</div>;
  }

  const post = postSnap.data();

  // 投稿者プロフィール取得
  let profileData = null;
  let profileID = "";
  if (post.postUser_profile) {
    const profileSnap = await getDoc(post.postUser_profile);
    if (profileSnap.exists()) {
      profileData = profileSnap.data();
      profileID = post.postUser_profile.id; // ← profileID取得
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
      .filter((doc) => doc.id !== postID)
      .map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  return (
    <>
      <PageHeader kaiwaiName={kaiwaiName} kaiwaiID={post.kaiwai?.id ?? ""} />


      {/* コンテンツ */}
      <div style={{ paddingTop: "80px" }}>
        {/* メイン投稿カード */}
        <div
    style={{
      width: "100%",
      margin: "0 auto",
      padding: "1.3rem 1rem" ,
      borderBottom: "1px solid #ddd",
      backgroundColor: "transparent",
      fontFamily: "Urbanist, sans-serif",
      position: "relative",
    }}
  >
          {/* 投稿者情報 */}
          {profileData && (
      <Link href={`/users/${userID}/profile/${profileID}`} style={{ textDecoration: "none" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem", cursor: "pointer" }}>
          <img
            src={profileData.photo || fallbackProfilePhoto}
            alt={profileData.name || "ユーザー"}
            style={{ width: "48px", height: "48px", borderRadius: "50%", marginRight: "0.75rem" }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: "500", fontSize: "0.95rem", color: "#333" }}>
              {profileData.name}
            </span>
            <span style={{ fontSize: "0.85rem", color: "#666", fontFamily: "Urbanist" }}>
              @{profileData.ID || userID}
            </span>
          </div>
        </div>
      </Link>
    )}

          {/* 投稿タイトル */}
          <h1
      style={{
        fontSize: "1rem",
        fontWeight: "400",
        marginBottom: post.postPhoto ? "1rem" : "1.6rem",
        color: "#333",
        marginLeft: "0.2rem",
        marginRight: "1.2rem",
　　　　 fontFamily: "Urbanist",
      }}
    >
      {post.postDescription}
    </h1>

          {/* 投稿写真 */}
    {post.postPhoto && (
      <img src={post.postPhoto} alt="投稿画像" style={{ width: "93%", marginBottom: "1rem" }} />
    )}

    {/* 投稿本文 */}
    {post.postContent && (
      <p style={{ fontFamily: "Urbanist", fontWeight: "400", fontSize: "0.95rem", lineHeight: "1.6", color: "#555", marginRight: "1.8rem"}}>{post.postContent}</p>
    )}

    {/* 投稿日時 */}
{post.timePosted && (
  <div
    style={{
      marginTop: "0.5rem",
      fontSize: "1rem",
      color: "#888",
      fontFamily: "'Urbanist','Montserrat',sans-serif",
      textAlign: "right",   // ← 追加
      marginRight: "2.4rem",

    }}
  >
    {formatTime(post.timePosted)}
  </div>
)}
  </div>

        {/* 他の投稿 */}
{profileData && (
  <div style={{ marginTop: "2.2rem", padding: "0 0rem" }}>
    <Link href={`/users/${userID}/profile/${profileID}`} style={{ textDecoration: "none" }}>
      <div style={{ textAlign: "center", marginBottom: "1rem", cursor: "pointer" }}>
        <h3
          style={{
            fontSize: "0.95rem",
            fontWeight: "500",
            color: "#222",
            margin: 0,
          }}
        >
          {profileData.name} の他の投稿
        </h3>
      </div>
    </Link>

    {/* 投稿一覧 */}
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {otherPosts.map((other, idx) => {
        let formattedOtherTime = "";
        if (other.timePosted) {
          const date = other.timePosted.toDate();
          formattedOtherTime = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        }

        return (
          <div
            key={idx}
            style={{
              padding: "1.3rem 1rem",
              borderBottom: "1px solid #ddd",
              backgroundColor: "transparent",
              width: "100%",
            }}
          >
            {/* 投稿者情報 */}
            <Link href={`/users/${userID}/profile/${profileID}`} style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem", cursor: "pointer" }}>
                <img
                  src={profileData.photo || fallbackProfilePhoto}
                  alt={profileData.name || "ユーザー"}
                  style={{ width: "48px", height: "48px", borderRadius: "50%", marginRight: "0.75rem" }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: "500", fontSize: "0.95rem", color: "#333", fontFamily: "Urbanist" }}>
                    {profileData.name}
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "#666", fontFamily: "Urbanist" }}>
                    @{profileData.ID || userID}
                  </span>
                </div>
              </div>
            </Link>

            {/* 投稿内容 */}
            <Link
              href={`/posts/${userID}/${other.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <h4
                style={{
                  fontSize: "0.95rem",
                  fontWeight: "400",
                  marginBottom: other.postPhoto ? "1rem" : "1.5rem",
                  color: "#333",
                  marginRight: "1.8rem",
                  fontFamily: "Urbanist",
                }}
              >
                {other.postDescription}
              </h4>

              {other.postPhoto && (
                <img
                  src={other.postPhoto}
                  alt="投稿画像"
                  style={{
                    width: "100%",
                    marginBottom: "1rem",
                  }}
                />
              )}

              {other.postContent && (
                <p
                  style={{
                    fontSize: "0.9rem",
                    lineHeight: "1.6",
                    color: "#555",
                  }}
                >
                  {other.postContent}
                </p>
              )}

              {/* 🔹 投稿日時（右寄せ） */}
              <div
                style={{
                  marginTop: "0.5rem",
                  fontSize: "1rem",
                  color: "#888",
                  textAlign: "right",
                  fontFamily: "'Urbanist','Montserrat',sans-serif",
                  marginRight: "2.4rem",
                }}
              >
                {formattedOtherTime}
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  </div>
)}
</div>
    </>
  );
}
