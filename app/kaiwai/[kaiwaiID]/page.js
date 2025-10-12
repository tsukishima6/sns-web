import { doc, getDoc, collectionGroup, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../../../lib/firebase"; // 相対パスで確実に取る
import Image from "next/image";
import Link from "next/link";

// フォールバック画像
const fallbackProfilePhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";
const fallbackOGP =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwai_admin.png?alt=media&token=a3a36f2a-d37f-49fb-a3a6-0914f24131a8";

// --- generateMetadata (簡易・安全版)
export async function generateMetadata({ params }) {
  const { kaiwaiID } = params;
  try {
    const kaiwaiRef = doc(db, "kaiwai", kaiwaiID);
    const kaiwaiSnap = await getDoc(kaiwaiRef);
    if (!kaiwaiSnap.exists()) {
      return {
        title: "KAIWAIが見つかりません",
        description: "指定された界隈は存在しません。",
      };
    }
    const kaiwai = kaiwaiSnap.data();
    return {
      title: `${kaiwai.name}界隈｜kaiwai`,
      description: `${kaiwai.name}界隈の"人"と"情報"が集まるSNS、kaiwaiです。`,
      openGraph: { images: [fallbackOGP] },
      twitter: { card: "summary_large_image", images: [fallbackOGP] },
    };
  } catch (err) {
    console.error("generateMetadata error:", err);
    return { title: "KAIWAI", description: "界隈ページ" };
  }
}

// --- ページ本体 ---
export default async function KaiwaiPage({ params }) {
  const { kaiwaiID } = params;

  // kaiwai 本体取得
const kaiwaiRef = doc(db, "kaiwai", kaiwaiID);
const kaiwaiSnap = await getDoc(kaiwaiRef);
if (!kaiwaiSnap.exists()) {
  return <div style={{ padding: "2rem", fontSize: "1.5rem" }}>KAIWAIが見つかりません</div>;
}
const kaiwai = kaiwaiSnap.data();

// parent が DocumentReference なら追加で取得
let parentKaiwai = null;
if (kaiwai.parent) {
  try {
    const parentSnap = await getDoc(kaiwai.parent);
    if (parentSnap.exists()) {
      parentKaiwai = { id: parentSnap.id, ...parentSnap.data() };
    }
  } catch (err) {
    console.error("parent fetch error:", err);
  }
}

  // collectionGroup で users/*/posts を横断して kaiwai フィールドが一致する投稿を取得
  let posts = [];
  try {
    const q = query(
      collectionGroup(db, "posts"),
      where("kaiwai", "==", kaiwaiRef),
      orderBy("timePosted", "desc")
    );
    const postsSnap = await getDocs(q);

    // 各投稿から userID を取り、必要なら profile も取得する
    posts = await Promise.all(
      postsSnap.docs.map(async (d) => {
        const data = d.data();
        // userID を親コレクションの親ドキュメントIDから取り出す
        let userID = null;
        try {
          userID = d.ref.parent.parent ? d.ref.parent.parent.id : null;
        } catch (e) {
          userID = null;
        }

        const postObj = { id: d.id, userID, ...data };

        // もし postUser_profile があればその参照からプロフィール取得（あれば name, photo, ID を入れる）
        if (data.postUser_profile) {
          try {
            const profileSnap = await getDoc(data.postUser_profile);
            if (profileSnap.exists()) {
              postObj.profile = { id: profileSnap.id, ...(profileSnap.data() || {}) };
            }
          } catch (e) {
            // 取得失敗でも続行
            console.error("profile fetch error for post", d.id, e);
          }
        }

        return postObj;
      })
    );

    console.log(`Kaiwai ${kaiwaiID} posts fetched:`, posts.length);
  } catch (err) {
    console.error("posts fetch error:", err);
  }

  return (
    <>
      {/* 固定ヘッダー */}
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
            <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "#222" }}>{kaiwai.name}</span>
            <span style={{ fontSize: "1.1rem", fontWeight: "600", color: "#222" }}>kaiwai</span>
          </h1>
          <div style={{ display: "flex", gap: "0.25rem" }}>
            <a href="https://apps.apple.com/jp/app/kaiwai/id6469412765" target="_blank" rel="noopener noreferrer">
              <img src="/apple.svg" alt="App Store" style={{ width: 28, height: 28 }} />
            </a>
            <a href="https://play.google.com/store/apps/details?id=com.flutterflow.tsukishima6" target="_blank" rel="noopener noreferrer">
              <img src="/googleplay.svg" alt="Google Play" style={{ width: 28, height: 28 }} />
            </a>
          </div>
        </div>
      </header>

      {/* コンテンツ */}
      <div style={{  marginTop: "70px", paddingTop: "90px", maxWidth: "720px", margin: "0 auto", padding: "1rem" }}>
        <h2 style={{ textAlign: "center", fontWeight: 400, fontSize: "1.0rem",marginBottom: "0.7rem", lineHeight: "1.6" }}>
          {kaiwai.name}界隈の"人"と"情報"が集まるSNSです。<br />
          他の界隈・アカウント作成は公式アプリから
        </h2>
{/* 他の界隈・アカウント作成はアプリから の下にアイコン */}
<div style={{ justifyContent: "center", display: "flex", gap: "0.5rem", marginBottom: "0.8rem" }}>
  <a href="https://apps.apple.com/jp/app/kaiwai/id6469412765" target="_blank" rel="noopener noreferrer">
    <img src="/apple.svg" alt="App Store" style={{ width: 28, height: 28 }} />
  </a>
  <a href="https://play.google.com/store/apps/details?id=com.flutterflow.tsukishima6" target="_blank" rel="noopener noreferrer">
    <img src="/googleplay.svg" alt="Google Play" style={{ width: 28, height: 28 }} />
  </a>
</div>
        {parentKaiwai && (
  <p
    style={{
      fontSize: "1rem",
      color: "#444",
      marginBottom: "1.6rem",
      backgroundColor: "#f1f1f1",
      padding: "0.8rem 1rem",
      borderRadius: "25px",
      textAlign: "center",
    }}
  >
    {parentKaiwai.name}のサブkaiwaiです
  </p>
)}

        {/* 投稿リスト */}
        {/* 投稿リスト */}
<div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
  {posts.length > 0 ? (
    posts.map((post) => (
      <Link
        key={post.id}
        href={`/posts/${post.userID || "unknown"}/${post.id}`}
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
          {/* 投稿者情報（profile があれば表示） */}
          {post.profile && (
            <div style={{ display: "flex", alignItems: "center", marginBottom: "0.6rem" }}>
              <img
                src={post.profile.photo || fallbackProfilePhoto}
                alt={post.profile.name || "ユーザー"}
                style={{ width: "48px", height: "48px", borderRadius: "50%", marginRight: "0.75rem", objectFit: "cover" }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: "500", fontSize: "1.0rem", color: "#333" }}>{post.profile.name}</span>
                <span style={{ fontSize: "1.0rem", color: "#666", fontFamily: "Urbanist" }}>@{post.profile.ID || post.userID}</span>
              </div>
            </div>
          )}

          {/* 投稿内容 */}
          <h4 style={{ fontSize: "1rem", fontWeight: "400", marginBottom: post.postPhoto ? "1rem" : "2rem", color: "#333" }}>
            {post.postDescription || "（本文なし）"}
          </h4>
          {post.postPhoto && <img src={post.postPhoto} alt="投稿画像" style={{ width: "100%", borderRadius: "8px", marginBottom: "1rem" }} />}
          {post.postContent && <p style={{ fontSize: "1rem", lineHeight: "1.6", color: "#555" }}>{post.postContent}</p>}

          {/* timePosted を右下に表示 */}
          {post.timePosted && (
            <span
              style={{
                position: "absolute",
                right: "1.2rem",
                bottom: "1.2rem",
                fontSize: "1.0rem",
                color: "#888",
                fontFamily: "Urbanist",
              }}
            >
              {new Date(post.timePosted.seconds * 1000).toLocaleString("ja-JP", {
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      </Link>
    ))
  ) : (
    <p style={{ color: "#666" }}>まだ投稿がありません</p>
  )}
</div>

      </div>
    </>
  );
}
