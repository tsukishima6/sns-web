import {
  doc,
  getDoc,
  collectionGroup,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import Link from "next/link";
import PageHeader from "../../../components/PageHeader";

const fallbackProfilePhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";
const fallbackOGP =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwai_admin.png?alt=media&token=a3a36f2a-d37f-49fb-a3a6-0914f24131a8";

export async function generateMetadata({ params }) {
  const { kaiwaiID, newsID } = params;
  const newsRef = doc(db, "kaiwai", kaiwaiID, "news", newsID);
  const newsSnap = await getDoc(newsRef);

  if (!newsSnap.exists()) {
    return { title: "ニュースが見つかりません | KAIWAI" };
  }

  const news = newsSnap.data();
  const title = news.title || "KAIWAI ニュース";
  const description = news.description || news.sitename || "";
  const ogImage = news.img || fallbackOGP;

  // 引用投稿(picks)が付いていれば独自コンテンツとしての厚みがあるとみなす。
  // orderByを付けているのは本文側のpicksクエリと全く同じクエリ形にして、
  // 同じ複合インデックス(quote_news ASC, timePosted DESC)を使い回すため
  // (orderByなしの単純な等号クエリだと別のインデックス要求になり、
  // "COLLECTION_GROUP_ASC index for collection posts and field quote_news"
  // というエラーになる)
  const picksCountSnap = await getDocs(
    query(collectionGroup(db, "posts"), where("quote_news", "==", newsRef), orderBy("timePosted", "desc"))
  );
  const indexable = picksCountSnap.size > 0;

  return {
    title,
    description,
    openGraph: { title, description, images: [ogImage] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function NewsDetailPage({ params }) {
  const { kaiwaiID, newsID } = params;

  const kaiwaiRef = doc(db, "kaiwai", kaiwaiID);
  const newsRef = doc(db, "kaiwai", kaiwaiID, "news", newsID);
  const [kaiwaiSnap, newsSnap] = await Promise.all([getDoc(kaiwaiRef), getDoc(newsRef)]);

  if (!newsSnap.exists()) {
    return (
      <div style={{ padding: "2rem", fontSize: "1.5rem", color: "var(--fg-primary)" }}>
        ニュースが見つかりません
      </div>
    );
  }

  const news = newsSnap.data();
  const kaiwaiName = kaiwaiSnap.exists() ? kaiwaiSnap.data().name || "" : "";

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // この記事を引用した投稿(picks)
  let picks = [];
  const picksSnap = await getDocs(
    query(
      collectionGroup(db, "posts"),
      where("quote_news", "==", newsRef),
      orderBy("timePosted", "desc")
    )
  );
  picks = await Promise.all(
    picksSnap.docs.map(async (d) => {
      const data = d.data();
      const userID = d.ref.parent.parent?.id || null;
      let profile = null;
      if (data.postUser_profile) {
        const pfSnap = await getDoc(data.postUser_profile);
        if (pfSnap.exists()) {
          const pf = pfSnap.data();
          profile = { name: pf.name || "", photo: pf.photo || "", ID: pf.ID || "" };
        }
      }
      return {
        id: d.id,
        userID,
        postDescription: data.postDescription || "",
        timePosted: data.timePosted || null,
        profile,
      };
    })
  );

  const quoteHref = `/post/new?quoteNews=${encodeURIComponent(`kaiwai/${kaiwaiID}/news/${newsID}`)}`;

  return (
    <>
      <PageHeader kaiwaiName={kaiwaiName} kaiwaiID={kaiwaiID} />

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "120px 1rem 2.5rem" }}>
        <div
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            paddingBottom: "1.3rem",
            marginBottom: "1.3rem",
          }}
        >
          {news.sitename && (
            <p style={{ fontSize: "0.85rem", color: "var(--fg-muted)", margin: "0 0 0.4rem" }}>
              {news.sitename}
              {news.time && <span> ・ {formatTime(news.time)}</span>}
            </p>
          )}

          <h1
            style={{
              fontSize: "1.3rem",
              fontWeight: 600,
              color: "var(--fg-primary)",
              margin: "0 0 1rem",
              lineHeight: 1.5,
            }}
          >
            {news.title}
          </h1>

          {news.img && (
            <img
              src={news.img}
              alt=""
              style={{ width: "100%", borderRadius: "16px", marginBottom: "1rem", objectFit: "cover" }}
            />
          )}

          {news.description && (
            <p style={{ fontSize: "0.9rem", color: "var(--fg-secondary)", lineHeight: 1.7, margin: "0 0 1.2rem" }}>
              {news.description}
            </p>
          )}

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {news.url && (
              <a
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "0.6rem 1.1rem",
                  fontSize: "0.85rem",
                  borderRadius: "999px",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--fg-primary)",
                  textDecoration: "none",
                }}
              >
                元記事を読む
              </a>
            )}
            <Link
              href={quoteHref}
              style={{
                padding: "0.6rem 1.1rem",
                fontSize: "0.85rem",
                borderRadius: "999px",
                background: "#000",
                color: "#fff",
                textDecoration: "none",
              }}
            >
              引用して投稿
            </Link>
          </div>
        </div>

        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--fg-primary)", margin: "0 0 0.8rem" }}>
          この記事の引用投稿
        </h2>

        {picks.length === 0 ? (
          <p style={{ fontSize: "0.85rem", color: "var(--fg-muted)" }}>まだ引用投稿はありません</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {picks.map((pick) => (
              <Link
                key={pick.id}
                href={`/posts/${pick.userID}/${pick.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div style={{ padding: "1rem 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  {pick.profile && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                      <img
                        src={pick.profile.photo || fallbackProfilePhoto}
                        alt={pick.profile.name || "ユーザー"}
                        style={{ width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" }}
                      />
                      <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--fg-primary)" }}>
                        {pick.profile.name}
                      </span>
                    </div>
                  )}
                  {pick.postDescription?.trim() && (
                    <p style={{ fontSize: "0.85rem", color: "var(--fg-secondary)", margin: 0, whiteSpace: "pre-wrap" }}>
                      {pick.postDescription}
                    </p>
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
