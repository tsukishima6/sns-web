import {
  doc,
  getDoc,
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import Image from "next/image";
import Link from "next/link";
import KaiwaiWordCloud from "../../components/wordcloud";
import AppDownloadDialogTrigger from "../../components/AppDownloadDialogTrigger";

const fallbackProfilePhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";

const fallbackOGP =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwai_admin.png?alt=media&token=a3a36f2a-d37f-49fb-a3a6-0914f24131a8";

// --- generateMetadata（noindex対応版）---
export async function generateMetadata({ params }) {
  const { kaiwaiID } = params;

  try {
    const kaiwaiRef = doc(db, "kaiwai", kaiwaiID);
    const kaiwaiSnap = await getDoc(kaiwaiRef);

    if (!kaiwaiSnap.exists()) {
      return {
        title: "kaiwaiが見つかりません",
        description: "指定されたkaiwaiは存在しません。",
        robots: "noindex, nofollow",
      };
    }

    const kaiwai = kaiwaiSnap.data();

    // 🔒 noindexがtrueの場合はインデックス禁止
    if (kaiwai.noindex === true) {
      return {
        title: `${kaiwai.name || "kaiwai"}｜非公開界隈`,
        description: "この界隈はインデックス対象外です。",
        robots: "noindex, nofollow",
      };
    }

    // 🌏 通常インデックス許可
    return {
      title: `${kaiwai.name}界隈｜kaiwaiSNS`,
      description: `${kaiwai.name}界隈の"人"と"情報"が集まるSNS、kaiwaiです。${kaiwai.description || ""}`,
      openGraph: { images: [fallbackOGP] },
      twitter: { card: "summary_large_image", images: [fallbackOGP] },
      robots: "index, follow",
    };
  } catch (err) {
    console.error("generateMetadata error:", err);
    return {
      title: "KAIWAI",
      description: "界隈ページ",
      robots: "noindex, nofollow",
    };
  }
}

// --- ページ本体 ---
export default async function KaiwaiPage({ params }) {
  const { kaiwaiID } = params;

  const kaiwaiRef = doc(db, "kaiwai", kaiwaiID);
  const kaiwaiSnap = await getDoc(kaiwaiRef);

  if (!kaiwaiSnap.exists()) {
    return (
      <div style={{ padding: "2rem", fontSize: "1.5rem" }}>
        KAIWAIが見つかりません
      </div>
    );
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

  // 投稿取得
  let posts = [];
  // 🔹 news取得（最大5件）
let newsList = [];
try {
  const newsSnap = await getDocs(
    query(
      collection(db, "kaiwai", kaiwaiID, "news"),
      orderBy("time", "desc"),
      limit(5)
    )
  );

  newsList = newsSnap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
} catch (err) {
  console.error("news fetch error:", err);
}

  try {
    const q = query(
      collectionGroup(db, "posts"),
      where("kaiwai", "==", kaiwaiRef),
      orderBy("timePosted", "desc")
    );
    const postsSnap = await getDocs(q);

    posts = await Promise.all(
      postsSnap.docs.map(async (d) => {
        const data = d.data();
        let userID = d.ref.parent.parent ? d.ref.parent.parent.id : null;
        const postObj = { id: d.id, userID, ...data };

        if (data.postUser_profile) {
          try {
            const profileSnap = await getDoc(data.postUser_profile);
            if (profileSnap.exists()) {
              postObj.profile = {
                id: profileSnap.id,
                ...(profileSnap.data() || {}),
              };
            }
          } catch (e) {
            console.error("profile fetch error for post", d.id, e);
          }
        }

        return postObj;
      })
    );
    // 🔹 30日以内の投稿だけ残す
    const now = Date.now();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    posts = posts.filter((post) => {
      if (!post.profile || !post.timePosted) return false;
      const postTime = post.timePosted.seconds
        ? post.timePosted.seconds * 1000
        : post.timePosted.toMillis?.();
      if (!postTime) return false;
      return now - postTime <= THIRTY_DAYS;
    });

    console.log(`Kaiwai ${kaiwaiID} posts after filter:`, posts.length);
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
            <Link
              href="https://kaiwai.vercel.app/"
              style={{ display: "inline-block" }}
            >
              <Image
                src="https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwailogo.png?alt=media&token=9cea2404-8c0c-466e-b69f-091715e423ad"
                alt="KAIWAI Logo"
                width={34}
                height={34}
                style={{ objectFit: "contain", cursor: "pointer" }}
              />
            </Link>
          </div>

          <h1
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "0.2rem",
              margin: 0,
              marginLeft: "1rem",
            }}
          >
            <span
              style={{
                fontSize: "1.0rem",
                fontWeight: "600",
                color: "#222",
              }}
            >
              {kaiwai.name}
            </span>
            <span
              style={{
                fontSize: "1.1rem",
                fontWeight: "600",
                color: "#222",
              }}
            >
              kaiwai
            </span>
            <div
              style={{
                background: "linear-gradient(135deg, #152635, #8fa8a7)",
                color: "#fff",
                borderRadius: "26px",
                padding: "0.1rem 0.6rem",
                fontSize: "0.9rem",
                fontWeight: "500",
                marginLeft: "0.1rem",
              }}
            >
              web版
            </div>
          </h1>

          <div style={{ display: "flex", gap: "0.25rem" }}>
            <a
              href="https://apps.apple.com/jp/app/kaiwai/id6469412765"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
  src="/ap.png"   // ※ 64×64 以上の画像
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
  src="/gp.png"   // ※ 64×64 以上の画像
  alt="Google Play"
  width={28}
  height={28}
  style={{ objectFit: "contain" }}
/>
            </a>
          </div>
        </div>
      </header>

      {/* コンテンツ */}
      <div
        style={{
          fontFamily: "Noto Sans JP , Shippori Mincho, Arial, Urbanist",
          maxWidth: "720px",
          paddingTop: "4.4rem",
          paddingLeft: "0rem",
          paddingRight: "0rem",
          paddingBottom: "2.5rem",
        }}
      >
        <h2
  style={{
    textAlign: "center",
    fontWeight: 400,
    fontSize: "0.9rem",
    marginTop: "1.5rem",
    marginBottom: "1.0rem",
    marginLeft: "2.1rem",
    marginRight: "2.1rem",
    lineHeight: "1.6",
    whiteSpace: "pre-line",
  }}
>
  {kaiwai.description}
  <br />
  他の界隈・アカウント作成は{" "}
  <AppDownloadDialogTrigger /> から
</h2>

{/* 🔹 kaiwai news */}
{newsList.length > 0 && (
  <>
    {/* 見出し（帯と隙間なし） */}
    <h2
  style={{
    fontSize: "1.2rem",
    fontWeight: 600,
    margin: 0,
    padding: "0.2rem 0 0.3rem",
    marginLeft: "2.2rem",
    fontFamily: "'Urbanist','Montserrat',sans-serif",

    background: "linear-gradient(135deg, #96acaa, #a7bebc)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  }}
>
  {kaiwai.name}界隈news
</h2>



    {/* 横幅いっぱいの帯 */}
    <div
      style={{
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        background: "linear-gradient(135deg, #8fa8a7, #eef2f3)",
        padding: "1.5rem 0 1.8rem",
      }}
    >
      {/* 中身はいつもの幅に戻す */}
      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "0 1rem",
          display: "flex",
          gap: "1.5rem",
          overflowX: "auto",
        }}
      >
        {newsList.map((n) => (
          <a
            key={n.id}
            href={n.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              minWidth: "220px",
              maxWidth: "220px",
              background: "#ffffff",
              borderRadius: "22px",
              padding: "1.4rem",
              textDecoration: "none",
              color: "#222",
              fontFamily: "'Urbanist','Montserrat',sans-serif",
              position: "relative",
            }}
          >
            {n.img && (
              <img
                src={n.img}
                alt=""
                style={{
                  width: "100%",
                  height: "120px",
                  objectFit: "cover",
                  borderRadius: "16px",
                  marginBottom: "0.6rem",
                }}
              />
            )}

            <h3
              style={{
                fontSize: "1.0rem",
                fontWeight: 500,
                lineHeight: "1.4",
                margin: 0,
                paddingBottom: "1.2rem",
              }}
            >
              {n.title}
            </h3>

            {n.sitename && (
              <div
                style={{
                  position: "absolute",
                  right: "0.9rem",
                  bottom: "0.8rem",
                  fontSize: "0.85rem",
                  color: "#8fa8a7",
                  whiteSpace: "nowrap",
                }}
              >
                {n.sitename}
              </div>
            )}
          </a>
        ))}
      </div>
    </div>
  </>
)}



        {parentKaiwai && (
          <p
            style={{
              fontSize: "1rem",
              color: "#444",
              marginBottom: "1.6rem",
              backgroundColor: "#f1f1f1",
              padding: "0.8rem 1rem",
              marginRight: "0.8rem",
              marginLeft: "0.8rem",
              borderRadius: "25px",
              textAlign: "center",
            }}
          >
            {parentKaiwai.name}のサブkaiwaiです
          </p>
        )}

        {/* 投稿リスト */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0rem",
          }}
        >
          {posts.length > 0 ? (
            posts.map((post) => (
              <Link
                key={post.id}
                href={`/posts/${post.userID || "unknown"}/${post.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
  style={{
    padding: "1.1rem 0",
    borderBottom: "1px solid #ddd",
    backgroundColor: "transparent",
    fontFamily: "Arial, sans-serif",
    position: "relative",
    width: "100%",
  }}
>

                  {post.profile && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "0.0rem",
                        marginLeft: "1.0rem",
                      }}
                    >
                      <img
                        src={post.profile.photo || fallbackProfilePhoto}
                        alt={post.profile.name || "ユーザー"}
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          marginRight: "0.75rem",
                          objectFit: "cover",
                        }}
                      />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "500",
                            fontSize: "0.9rem",
                            color: "#333",
                          }}
                        >
                          {post.profile.name}
                        </span>
                        <span
                          style={{
                            fontSize: "0.9rem",
                            color: "#666",
                            fontFamily: "Urbanist",
                          }}
                        >
                          @{post.profile.ID || post.userID}
                        </span>
                      </div>
                    </div>
                  )}

                  <h4
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: "400",
                      marginBottom: post.postPhoto ? "0.9rem" : "1.8rem",
                      color: "#333",
                      marginLeft: "1.0rem",
                      marginRight: "1.0rem",
                      marginTop: "0.9rem",
                    }}
                  >
                    {post.postDescription || "（本文なし）"}
                  </h4>

                  {post.postPhoto && (
                    <img
                      src={post.postPhoto}
                      alt="投稿画像"
                      style={{
                        width: "100%",
                        borderRadius: "8px",
                        marginBottom: "1rem",
                      }}
                    />
                  )}

                  {post.postContent && (
                    <p
                      style={{
                        fontSize: "1rem",
                        lineHeight: "1.6",
                        color: "#555",
                      }}
                    >
                      {post.postContent}
                    </p>
                  )}

                  {post.timePosted && (
                    <span
                      style={{
                        position: "absolute",
                        right: "1.2rem",
                        bottom: "0.8rem",
                        fontSize: "1.0rem",
                        color: "#888",
                        fontFamily: "Urbanist",
                      }}
                    >
                      {new Date(
                        post.timePosted.seconds * 1000
                      ).toLocaleString("ja-JP", {
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

      <div style={{ marginTop: "0rem", marginBottom: "0rem" }}>
        <KaiwaiWordCloud />
      </div>
    </>
  );
}
