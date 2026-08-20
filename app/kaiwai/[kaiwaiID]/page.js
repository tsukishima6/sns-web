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
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { fetchOgImage } from "../../../lib/fetchOgImage";
import Image from "next/image";
import Link from "next/link";
import WordCloudSphere from "../../components/WordCloudSphere";
import AppDownloadDialogTrigger from "../../components/AppDownloadDialogTrigger";
import PageHeader from "../../components/PageHeader";
import KaiwaiEditLink from "../../components/KaiwaiEditLink";
import KaiwaiJoinButton from "../../components/KaiwaiJoinButton";

const fallbackProfilePhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";

const fallbackOGP =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwai_admin.png?alt=media&token=a3a36f2a-d37f-49fb-a3a6-0914f24131a8";

// ISRでキャッシュさせる（毎リクエストFirestore叩く no-store状態を解消し、TTFBとクロール効率を改善）
export const revalidate = 1800;

// 投稿ごとのgetDoc(投稿者profile取得)を無制限にPromise.allで同時実行すると、
// 投稿数の多いkaiwai(全新規サインアップのデフォルト着地先である000htmz「ビギナーズ」で
// 実測390件超)でFirestore Web SDK内部がRangeError: Maximum call stack size exceededで
// 落ち、ページがハングする(2026-08-19発見)。同時実行数を絞って順に処理する
async function mapWithConcurrency(items, concurrency, fn) {
  const results = new Array(items.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await fn(items[current], current);
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

// --- generateMetadata（SEO強化版）---
export async function generateMetadata({ params }) {
  const { kaiwaiID } = params;

  try {
    const kaiwaiRef = doc(db, "kaiwai", kaiwaiID);
    const kaiwaiSnap = await getDoc(kaiwaiRef);

    if (!kaiwaiSnap.exists()) {
      return {
        title: "kaiwaiが見つかりません",
        description: "指定されたkaiwaiは存在しません。",
        robots: { index: false, follow: false },
      };
    }

    const kaiwai = kaiwaiSnap.data();

    // 🔒 noindexがtrueの場合はインデックス禁止
    if (kaiwai.noindex === true) {
      return {
        title: `${kaiwai.name || "kaiwai"}｜非公開界隈`,
        description: "この界隈はインデックス対象外です。",
        robots: { index: false, follow: false },
      };
    }

    // 🔹 description整形（改行除去 + 文字数調整）
    const cleanedDescription = (kaiwai.description || "")
      .replace(/\s+/g, " ")  // 改行・余分な空白除去
      .trim()
      .slice(0, 140);        // 約140文字でカット（安全圏）

    const finalDescription =
      cleanedDescription.length > 0
        ? `${kaiwai.name}界隈のSNS「kaiwai」。${kaiwai.name}好きが集まり、投稿・交流できます。${cleanedDescription}`
        : `${kaiwai.name}界隈のSNS「kaiwai」。${kaiwai.name}好きが集まり、投稿・交流できます。`;

    return {
      title: `${kaiwai.name}界隈のSNS｜kaiwai`,
      description: finalDescription,
      alternates: {
        canonical: `/kaiwai/${kaiwaiID}`,
      },
      openGraph: {
        title: `${kaiwai.name}界隈のSNS｜kaiwai`,
        description: finalDescription,
        images: [fallbackOGP],
      },
      twitter: {
        card: "summary_large_image",
        title: `${kaiwai.name}界隈のSNS｜kaiwai`,
        description: finalDescription,
        images: [fallbackOGP],
      },
      robots: {
        index: true,
        follow: true,
      },
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
      <div style={{ padding: "2rem", fontSize: "1.5rem", color: "var(--fg-primary)" }}>
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

  // Google News RSS由来のニュースはimgフィールドが空のことが多いため、
  // 無ければリンク先からog:imageを動的に取得する(最大5件なので同時実行のまま)
  newsList = await Promise.all(
    newsSnap.docs.map(async (d) => {
      const data = d.data();
      const img = data.img || (data.url ? (await fetchOgImage(data.url)) || "" : "");
      return { id: d.id, ...data, img };
    })
  );
} catch (err) {
  console.error("news fetch error:", err);
}

  try {
    const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
    const ninetyDaysAgo = Timestamp.fromDate(new Date(Date.now() - NINETY_DAYS_MS));

    // timePostedの範囲指定+limitをFirestoreクエリ自体に持たせる(以前はorderByのみで
    // 全件取得してからJS側で90日フィルタしており、投稿数の多いkaiwaiで下のprofile取得が
    // 数百件同時実行になりハングする原因になっていた。同じフィールドへのrange filter+
    // orderByなので追加の複合インデックスは不要)
    const q = query(
      collectionGroup(db, "posts"),
      where("kaiwai", "==", kaiwaiRef),
      where("timePosted", ">=", ninetyDaysAgo),
      orderBy("timePosted", "desc"),
      limit(80)
    );
    const postsSnap = await getDocs(q);

    // 投稿ごとのpostUser_profile取得(getDoc)を無制限に同時実行しない(mapWithConcurrency参照)
    posts = await mapWithConcurrency(postsSnap.docs, 10, async (d) => {
      const data = d.data();
      let userID = d.ref.parent.parent ? d.ref.parent.parent.id : null;
      // dataを丸ごとspreadしない: postUser/postUser_profile/kaiwai等のDocumentReference
      // フィールドが混入すると、RSCシリアライズ時にFirestore SDK内部の巨大な内部オブジェクト
      // グラフを再帰的に辿ろうとしRangeError: Maximum call stack size exceededでページごと
      // 落ちる(kaiwai-web/CLAUDE.md記載の既知の罠と同じパターン、実際に参加機能のテストで発見)
      const postObj = {
        id: d.id,
        userID,
        postDescription: data.postDescription || "",
        postPhoto: data.postPhoto || "",
        postContent: data.postContent || "",
        timePosted: data.timePosted || null,
      };

      if (data.postUser_profile) {
        try {
          const profileSnap = await getDoc(data.postUser_profile);
          if (profileSnap.exists()) {
            const profileData = profileSnap.data() || {};
            postObj.profile = {
              id: profileSnap.id,
              name: profileData.name || "",
              photo: profileData.photo || "",
              ID: profileData.ID || "",
            };
          }
        } catch (e) {
          console.error("profile fetch error for post", d.id, e);
        }
      }

      return postObj;
    });

    posts = posts.filter((post) => post.profile);

    console.log(`Kaiwai ${kaiwaiID} posts after filter:`, posts.length);
  } catch (err) {
    console.error("posts fetch error:", err);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `${kaiwai.name}界隈のSNS｜kaiwai`,
    "description": kaiwai.description || `${kaiwai.name}界隈のSNS「kaiwai」`,
    "url": `https://kaiwai.vercel.app/kaiwai/${kaiwaiID}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHeader kaiwaiName={kaiwai.name} kaiwaiID={kaiwaiID} />

      {/* コンテンツ */}
      <div
        style={{
          fontFamily: "Noto Sans JP , Shippori Mincho, Arial, Urbanist",
          maxWidth: "960px",
          margin: "0 auto",
          paddingTop: "7.4rem",
          paddingLeft: "1rem",
          paddingRight: "1rem",
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
    fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif",
  }}
>
  {kaiwai.description}
  <br />
  他の界隈・アカウント作成は{" "}
  <AppDownloadDialogTrigger /> から
</h2>

<KaiwaiJoinButton kaiwaiID={kaiwaiID} kaiwaiName={kaiwai.name} />
<KaiwaiEditLink kaiwaiID={kaiwaiID} />

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
    fontFamily: "'Urbanist',sans-serif",

    background: "linear-gradient(135deg, #96acaa, #a7bebc)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  }}
>
  {kaiwai.name}界隈<span style={{ fontFamily: "'Urbanist', sans-serif" }}>news</span>
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
          maxWidth: "960px",
          margin: "0 auto",
          padding: "0 1rem",
          display: "flex",
          gap: "1.5rem",
          overflowX: "auto",
        }}
      >
        {newsList.map((n) => {
          const title =
            n.title && n.title.length > 40 ? `${n.title.slice(0, 40)}…` : n.title;
          return (
          <Link
            key={n.id}
            href={`/news/${kaiwaiID}/${n.id}`}
            style={{
              minWidth: "220px",
              maxWidth: "220px",
              background: "var(--surface)",
              borderRadius: "22px",
              overflow: "hidden",
              textDecoration: "none",
              color: "var(--fg-primary)",
              fontFamily: "'Urbanist',sans-serif",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {n.img && (
              <img
                src={n.img}
                alt=""
                style={{
                  display: "block",
                  width: "100%",
                  height: "120px",
                  objectFit: "cover",
                }}
              />
            )}

            <div style={{ padding: "1.4rem" }}>
              <h3
                style={{
                  fontSize: "1.0rem",
                  fontWeight: 500,
                  lineHeight: "1.4",
                  margin: 0,
                  paddingBottom: "1.2rem",
                }}
              >
                {title}
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
            </div>
          </Link>
          );
        })}
      </div>
    </div>
  </>
)}



        {parentKaiwai && (
          <p
            style={{
              fontSize: "1rem",
              color: "var(--fg-secondary)",
              marginBottom: "1.6rem",
              backgroundColor: "var(--surface-muted)",
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
<h2
  style={{
    fontSize: "1.6rem",
    fontWeight: 600,
    margin: "1.8rem 0 0.6rem",
    marginLeft: "1.0rem",
    fontFamily: "'Urbanist',sans-serif",
  }}
>
  posts
</h2>

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
    borderBottom: "1px solid var(--border-subtle)",
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
                            color: "var(--fg-primary)",
                          }}
                        >
                          {post.profile.name}
                        </span>
                        <span
                          style={{
                            fontSize: "0.9rem",
                            color: "var(--fg-secondary)",
                            fontFamily: "Urbanist",
                          }}
                        >
                          @{post.profile.ID || post.userID}
                        </span>
                      </div>
                    </div>
                  )}

                  <p
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: "400",
                      marginBottom: post.postPhoto ? "0.9rem" : "1.8rem",
                      color: "var(--fg-primary)",
                      marginLeft: "1.0rem",
                      marginRight: "1.0rem",
                      marginTop: "0.9rem",
                    }}
                  >
                    {post.postDescription || "（本文なし）"}
                  </p>

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
                        color: "var(--fg-secondary)",
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
                        color: "var(--fg-muted)",
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
            <p style={{ color: "var(--fg-secondary)" }}>まだ投稿がありません</p>
          )}
        </div>
      </div>
{/* 🔻 posts 下のブランド紹介セクション */}
<div
  style={{
    width: "100vw",
    marginLeft: "calc(50% - 50vw)",
    marginTop: "0.5rem",
    backgroundImage:
      "url(https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwai_back.png?alt=media&token=e9b9293d-2a97-4b14-b4ee-c9b285e38372)",
    backgroundSize: "contain",
    backgroundPosition: "right center",
    backgroundRepeat: "no-repeat",
  }}
>
  {/* うっすら読みやすくするオーバーレイ */}
  <div
    style={{
      backdropFilter: "blur(0px)",
      WebkitBackdropFilter: "blur(0px)",
      padding: "2.2rem 0",
    }}
  >
    {/* 中身はいつもの幅 */}
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "0 1.4rem",
        textAlign: "left",
        color: "var(--fg-primary)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "1.0rem",
          lineHeight: "1.6",
          letterSpacing: "0.02em",
          fontFamily: "Noto Sans JP, Arial",
          color: "var(--fg-primary)",
        }}
      >
        界隈の数だけ、snsがあっていい。
      </p>

      <h2
        style={{
          margin: "0.4rem 0 1.1rem",
          fontSize: "2.5rem",
          fontWeight: 700,
          fontFamily: "'Urbanist',sans-serif",
          background: "linear-gradient(135deg, #152635, #8fa8a7)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          lineHeight: 1.1,
        }}
      >
        kaiwai
      </h2>

      <p
        style={{
          margin: "0 0 0.9rem",
          fontSize: "0.90rem",
          lineHeight: "1.9",
          letterSpacing: "0.02em",
          fontFamily: "Noto Sans JP, Arial",
          whiteSpace: "pre-line",
        }}
      >
        趣味、地域、職種、悩み・・
        {"\n"}各界隈のユーザーが集う国産SNS。
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "0.90rem",
          lineHeight: "1.9",
          letterSpacing: "0.02em",
          fontFamily: "Noto Sans JP, Arial",
          whiteSpace: "pre-line",
        }}
      >
        {kaiwai.name}だけではありません。
        {"\n"}界隈は自由に追加・切り替え。
        {"\n"}ご自身で界隈を立ち上げ、
　　　　　{"\n"}メンバーを募ることも。
      </p>
    </div>
  </div>
</div>

      {/* トップページのMVと同じフィボナッチ球ワードクラウドを背景として設置 */}
      <div style={{ position: "relative", height: "320px", overflow: "hidden" }}>
        <WordCloudSphere />
      </div>

    </>
  );
}
