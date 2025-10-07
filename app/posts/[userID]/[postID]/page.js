import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ------------------------
// 1. 静的生成用（全投稿ページをビルド時に生成）
// ------------------------
export async function generateStaticParams() {
  const usersSnap = await getDocs(collection(db, "users"));
  const paths = [];

  for (const userDoc of usersSnap.docs) {
    const postsSnap = await getDocs(collection(db, "users", userDoc.id, "posts"));
    for (const postDoc of postsSnap.docs) {
      paths.push({ userID: userDoc.id, postID: postDoc.id });
    }
  }

  return paths; // [{ userID, postID }, ...]
}

// ------------------------
// 2. SEO情報
// ------------------------
export async function generateMetadata({ params }) {
  const { userID, postID } = params;
  const postRef = doc(db, "users", userID, "posts", postID);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) {
    return { title: "投稿が見つかりません" };
  }

  const post = postSnap.data();
  return {
    title: post.postDescription,
    description: post.postContent?.slice(0, 120) || "",
    openGraph: {
      title: post.postDescription,
      description: post.postContent?.slice(0, 120) || "",
      type: "article",
    },
  };
}

// ------------------------
// 3. 投稿ページ本体
// ------------------------
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
  if (post.postUser_profile) {
    const profileSnap = await getDoc(post.postUser_profile);
    if (profileSnap.exists()) {
      profileData = profileSnap.data();
    }
  }

  // 投稿日時フォーマット
  let formattedTime = "";
  if (post.timePosted) {
    const date = post.timePosted.toDate();
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    formattedTime = `${y}年${m}月${d}日${h}:${min}`;
  }

  return (
    <div style={{
      maxWidth: "600px",
      margin: "2rem auto",
      padding: "1.5rem",
      border: "1px solid #ddd",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      backgroundColor: "#fff",
      fontFamily: "Arial, sans-serif",
      position: "relative"
    }}>
      {/* 投稿者情報 */}
      {profileData && (
        <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
          {profileData.photo && (
            <img
              src={profileData.photo}
              alt={profileData.name}
              style={{ width: "48px", height: "48px", borderRadius: "50%", marginRight: "0.75rem" }}
            />
          )}
          <span style={{ fontWeight: "500", fontSize: "1.1rem", color: "#333" }}>
            {profileData.name}
          </span>
        </div>
      )}

      {/* 投稿タイトル */}
      <h1 style={{ fontSize: "1.1rem", fontWeight: "300", marginBottom: "2.2rem", color: "#333" }}>
        {post.postDescription}
      </h1>

      {/* 投稿本文 */}
      {post.postContent && (
        <p style={{ fontSize: "1.2rem", lineHeight: "1.6", color: "#555" }}>
          {post.postContent}
        </p>
      )}

      {/* 投稿日時（右下） */}
      {formattedTime && (
        <div style={{
          position: "absolute",
          bottom: "1.5rem",
          right: "1.8em",
          fontSize: "0.95rem",
          color: "#888"
        }}>
          {formattedTime}
        </div>
      )}
    </div>
  );
}
