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
import AppPromoLink from "../../components/AppPromoLink";
import PageHeader from "../../components/PageHeader";
import KaiwaiEditLink from "../../components/KaiwaiEditLink";
import KaiwaiJoinButton from "../../components/KaiwaiJoinButton";
import NewsQuoteEmbed from "../../components/NewsQuoteEmbed";

const fallbackProfilePhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";

const fallbackOGP =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwai_admin.png?alt=media&token=a3a36f2a-d37f-49fb-a3a6-0914f24131a8";

// フィボナッチ球の上にテキストを重ねる箇所で使う: 文字の周囲だけを白背景にして可読性を上げる。
// box-decoration-break:cloneで折り返し行ごとに背景を分割することで、テキストの矩形全体ではなく
// 行の文字幅にぴったり沿ったハイライトになる。
// backdrop-filterは box-decoration-break:clone で行ごとに分割されず、Chromeでは複数行の
// バウンディングボックス全体にまとめてブラーがかかってしまう(段落全体を覆う意図しないブラーになる)ため使わない
const textOnBgHighlightStyle = {
  background: "rgba(255, 255, 255, 0.78)",
  boxDecorationBreak: "clone",
  WebkitBoxDecorationBreak: "clone",
  padding: "2px",
  borderRadius: "4px",
};

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

// generateMetadataとJSON-LD(WebPageのdescription)で同じ文言を使うための共通ロジック。
// 別々に書くと表記がずれる(以前はJSON-LD側だけkaiwai.descriptionの生値を使っていた)
function buildKaiwaiDescription(kaiwai) {
  const cleanedDescription = (kaiwai.description || "")
    .replace(/\s+/g, " ") // 改行・余分な空白除去
    .trim()
    .slice(0, 140); // 約140文字でカット（安全圏）

  return cleanedDescription.length > 0
    ? `${kaiwai.name}界隈のSNS「kaiwai」。${kaiwai.name}好きが集まり、投稿・交流できます。${cleanedDescription}`
    : `${kaiwai.name}界隈のSNS「kaiwai」。${kaiwai.name}好きが集まり、投稿・交流できます。`;
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

    const finalDescription = buildKaiwaiDescription(kaiwai);

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

  // 🔹 タグ一覧取得（kaiwai固有・準静的な語彙。posts/newsと違い投稿のたび変わらない）
  // orderByをFirestoreクエリに持たせると`amount`フィールドが無いドキュメントが結果から
  // 丸ごと消える(explore一覧の`orderBy("number")`と同じ既知の罠)ため、全件取得してJS側でソートする
  let tags = [];
  try {
    const tagsSnap = await getDocs(collection(db, "kaiwai", kaiwaiID, "category"));
    tags = tagsSnap.docs
      .map((d) => ({ id: d.id, name: d.data().category_name || "", amount: d.data().amount || 0 }))
      .filter((t) => t.name)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  } catch (err) {
    console.error("tags fetch error:", err);
  }

  // 🔹 子kaiwai取得（自分がoya=trueの場合のサブkaiwai一覧）
  let childKaiwaiList = [];
  if (kaiwai.oya === true) {
    try {
      const childSnap = await getDocs(
        query(collection(db, "kaiwai"), where("parent", "==", kaiwaiRef))
      );
      childKaiwaiList = childSnap.docs
        .filter((d) => d.data().noindex !== true)
        .map((d) => ({ id: d.id, name: d.data().name || "" }));
    } catch (err) {
      console.error("child kaiwai fetch error:", err);
    }
  }

  // 🔹 兄弟kaiwai取得（親kaiwaiが同じで自分以外の子kaiwai）
  let siblingKaiwaiList = [];
  if (kaiwai.parent) {
    try {
      const siblingSnap = await getDocs(
        query(collection(db, "kaiwai"), where("parent", "==", kaiwai.parent))
      );
      siblingKaiwaiList = siblingSnap.docs
        .filter((d) => d.id !== kaiwaiID && d.data().noindex !== true)
        .map((d) => ({ id: d.id, name: d.data().name || "" }));
    } catch (err) {
      console.error("sibling kaiwai fetch error:", err);
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

      // ニュース引用元を取得(data.quote_newsが元ニュースへのDocumentReference、
      // app/posts/[userID]/[postID]/page.jsと同じ取得パターン)
      if (data.quote_news) {
        try {
          const newsSnap = await getDoc(data.quote_news);
          if (newsSnap.exists()) {
            const newsData = newsSnap.data();
            postObj.quotedNews = {
              id: newsSnap.id,
              kaiwaiId: newsSnap.ref.parent.parent?.id || null,
              title: newsData.title || "",
              sitename: newsData.sitename || "",
              img: newsData.img || "",
              time: newsData.time
                ? { seconds: newsData.time.seconds, nanoseconds: newsData.time.nanoseconds }
                : null,
            };
          }
        } catch (e) {
          console.error("quote_news fetch error for post", d.id, e);
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
    "description": buildKaiwaiDescription(kaiwai),
    "url": `https://kaiwai.vercel.app/kaiwai/${kaiwaiID}`,
    "dateModified": kaiwai.last_joined_at
      ? new Date(kaiwai.last_joined_at.seconds * 1000).toISOString()
      : undefined,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "kaiwai", "item": "https://kaiwai.vercel.app/" },
      { "@type": "ListItem", "position": 2, "name": "界隈を探す", "item": "https://kaiwai.vercel.app/explore" },
      {
        "@type": "ListItem",
        "position": 3,
        "name": `${kaiwai.name}界隈`,
        "item": `https://kaiwai.vercel.app/kaiwai/${kaiwaiID}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <PageHeader kaiwaiName={kaiwai.name} kaiwaiID={kaiwaiID} />

      {/* コンテンツ */}
      <div
        className="pt-[75px] md:pt-[90px]"
        style={{
          fontFamily: "Urbanist, 'Noto Sans JP', 'Shippori Mincho', Arial",
          maxWidth: "960px",
          margin: "0 auto",
          paddingLeft: "1rem",
          paddingRight: "1rem",
          paddingBottom: "2.5rem",
        }}
      >
        <nav
          aria-label="パンくずリスト"
          style={{
            fontSize: "0.75rem",
            color: "var(--fg-muted)",
            marginTop: "0",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            flexWrap: "wrap",
            fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif",
          }}
        >
          <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
            kaiwai
          </Link>
          <span>›</span>
          <Link href="/explore" style={{ color: "inherit", textDecoration: "none" }}>
            界隈を探す
          </Link>
          <span>›</span>
          <span style={{ color: "var(--fg-secondary)" }}>{kaiwai.name}界隈</span>
        </nav>

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
  他の界隈・アカウント作成は<AppPromoLink>こちら</AppPromoLink>から
</h2>

<KaiwaiJoinButton kaiwaiID={kaiwaiID} kaiwaiName={kaiwai.name} />
<KaiwaiEditLink kaiwaiID={kaiwaiID} />

{/* 🔹 タグ一覧（kaiwai固有・準静的なコンテンツ） */}
{tags.length > 0 && (
  <div
    style={{
      marginTop: "1.2rem",
      marginBottom: "0.4rem",
      display: "flex",
      flexWrap: "wrap",
      gap: "0.5rem",
      justifyContent: "center",
    }}
  >
    {tags.map((tag) => (
      <Link
        key={tag.id}
        href={`/kaiwai/${kaiwaiID}/category/${tag.id}`}
        style={{
          fontSize: "0.8rem",
          color: "var(--fg-secondary)",
          backgroundColor: "var(--surface-muted)",
          borderRadius: "999px",
          padding: "0.3rem 0.8rem",
          textDecoration: "none",
          fontFamily: "'Urbanist', sans-serif",
        }}
      >
        #{tag.name}
      </Link>
    ))}
  </div>
)}

{/* 🔹 kaiwai news */}
{newsList.length > 0 && (
  <>
    {/* 横幅いっぱいの帯（見出しも中に内包） */}
    <div
      style={{
        width: "100vw",
        marginLeft: "calc(50% - 50vw)",
        marginTop: "24px",
        marginBottom: "24px",
        backgroundImage: "linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.15)), url(/news.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "1.5rem 0 1.8rem",
      }}
    >
      {/* 中身はいつもの幅に戻す（見出しも同じ列に内包し、投稿一覧の左端と揃える） */}
      <div
        style={{
          maxWidth: "960px",
          margin: "0 auto",
          padding: "0 1rem",
        }}
      >
        {/* 見出し */}
        <h2
          style={{
            fontSize: "1.2rem",
            fontWeight: 600,
            margin: 0,
            padding: "0.2rem 0 0.3rem",
            marginLeft: "32px",
            fontFamily: "'Urbanist',sans-serif",
            color: "#fff",
          }}
        >
          {kaiwai.name}界隈<span style={{ fontFamily: "'Urbanist', sans-serif" }}>news</span>
        </h2>

        {/* カード横スクロール行 */}
        <div
          style={{
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
              background: "var(--card-bg)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              isolation: "isolate",
              transform: "translateZ(0)",
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
                alt={n.title || `${kaiwai.name}界隈のニュース`}
                width={220}
                height={120}
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
            <Link
              href={`/kaiwai/${parentKaiwai.id}`}
              style={{ color: "inherit", fontWeight: 600, textDecoration: "underline" }}
            >
              {parentKaiwai.name}
            </Link>
            のサブkaiwaiです
          </p>
        )}

        {/* 🔹 サブkaiwai・関連kaiwai（内部リンクによる回遊性向上） */}
        {childKaiwaiList.length > 0 && (
          <div style={{ marginBottom: "1.4rem", marginLeft: "0.8rem", marginRight: "0.8rem" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--fg-secondary)", marginBottom: "0.5rem", marginLeft: "8px" }}>
              サブ界隈：
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {childKaiwaiList.map((c) => (
                <Link
                  key={c.id}
                  href={`/kaiwai/${c.id}`}
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--fg-primary)",
                    backgroundColor: "var(--surface-muted)",
                    borderRadius: "16px",
                    padding: "0.4rem 0.9rem",
                    textDecoration: "none",
                  }}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {siblingKaiwaiList.length > 0 && (
          <div style={{ marginBottom: "1.4rem", marginLeft: "0.8rem", marginRight: "0.8rem" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--fg-secondary)", marginBottom: "0.5rem" }}>
              関連する界隈
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {siblingKaiwaiList.map((s) => (
                <Link
                  key={s.id}
                  href={`/kaiwai/${s.id}`}
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--fg-primary)",
                    backgroundColor: "var(--surface-muted)",
                    borderRadius: "16px",
                    padding: "0.4rem 0.9rem",
                    textDecoration: "none",
                  }}
                >
                  {s.name}
                </Link>
              ))}
            </div>
          </div>
        )}

<h2
  style={{
    fontSize: "1.2rem",
    fontWeight: 600,
    margin: "1.8rem 0 0.6rem",
    marginLeft: "1.0rem",
    fontFamily: "'Urbanist',sans-serif",
    background: "linear-gradient(135deg, #152635, #8fa8a7)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  }}
>
  {kaiwai.name}界隈のposts
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
    fontFamily: "Urbanist, Arial, sans-serif",
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
                      marginBottom: post.postPhoto ? "0.9rem" : "14px",
                      color: "var(--fg-primary)",
                      marginLeft: "1.0rem",
                      marginRight: "1.0rem",
                      marginTop: "0.9rem",
                    }}
                  >
                    {post.postDescription || "（本文なし）"}
                  </p>

                  {post.quotedNews && (
                    <div style={{ marginLeft: "1.0rem", marginRight: "1.0rem" }}>
                      <NewsQuoteEmbed quotedNews={post.quotedNews} />
                    </div>
                  )}

                  {post.postPhoto && (
                    <img
                      src={post.postPhoto}
                      alt={
                        post.postDescription
                          ? post.postDescription.slice(0, 60)
                          : `${kaiwai.name}界隈の投稿画像`
                      }
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
                        display: "block",
                        textAlign: "right",
                        marginTop: "18px",
                        marginLeft: "1.0rem",
                        marginRight: "1.2rem",
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
{/* 🔻 posts 下のブランド紹介セクション（背景にフィボナッチ球ワードクラウド） */}
<div
  style={{
    width: "100vw",
    marginLeft: "calc(50% - 50vw)",
    marginTop: "0.5rem",
    position: "relative",
    // フィボナッチ球の半径190px(WordCloudSphere.js)+ラベル文字分の余白を確保しないと
    // 上下の点(極付近)がoverflow:hiddenで切れる
    height: "400px",
    overflow: "hidden",
  }}
>
  {/* 背景: フィボナッチ球（PC/スマホ共通） */}
  <WordCloudSphere />

  {/* うっすら読みやすくするオーバーレイ */}
  <div
    style={{
      position: "relative",
      backdropFilter: "blur(0px)",
      WebkitBackdropFilter: "blur(0px)",
      padding: "2.2rem 0",
    }}
  >
    {/* 中身はいつもの幅（画像の右端をメインカラムの右端に揃える） */}
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "0 1.4rem",
        textAlign: "left",
        color: "var(--fg-primary)",
        backgroundImage:
          "url(https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwai_back.png?alt=media&token=e9b9293d-2a97-4b14-b4ee-c9b285e38372)",
        backgroundSize: "contain",
        backgroundPosition: "right center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: "1.0rem",
          lineHeight: "1.6",
          letterSpacing: "0.02em",
          fontFamily: "Urbanist, 'Noto Sans JP', Arial",
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
          fontFamily: "Urbanist, 'Noto Sans JP', Arial",
          whiteSpace: "pre-line",
        }}
      >
        <span style={textOnBgHighlightStyle}>
          趣味、地域、職種、悩み・・
          {"\n"}各界隈のユーザーが集う国産SNS。
        </span>
      </p>

      <p
        style={{
          margin: 0,
          fontSize: "0.90rem",
          lineHeight: "1.9",
          letterSpacing: "0.02em",
          fontFamily: "Urbanist, 'Noto Sans JP', Arial",
          whiteSpace: "pre-line",
        }}
      >
        <span style={textOnBgHighlightStyle}>
          {kaiwai.name}だけではありません。
          {"\n"}界隈は自由に追加・切り替え。
          {"\n"}ご自身で界隈を立ち上げ、
　　　　　{"\n"}メンバーを募ることも。
        </span>
      </p>
    </div>
  </div>
</div>

    </>
  );
}
