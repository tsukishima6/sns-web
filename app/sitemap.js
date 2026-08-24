import { collection, collectionGroup, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { isPostIndexable, isBusinessIndexable, isEventIndexable } from "../lib/postIndexing";

// クロール頻度を抑えるため1時間キャッシュ(kaiwai一覧・全投稿の走査は毎回だと重い)
export const revalidate = 3600;

export default async function sitemap() {
  const baseUrl = "https://kaiwai.vercel.app";

  let kaiwaiUrls = [];
  try {
    const snap = await getDocs(collection(db, "kaiwai"));
    kaiwaiUrls = snap.docs
      .filter((doc) => doc.data().noindex !== true)
      .map((doc) => {
        // last_joined_atはネイティブ側Cloud Function(onKaiwaiMemberJoined)が書き込む
        // 「直近参加日時」。実際の更新シグナルが無いkaiwaiまで毎回new Date()を返すと
        // クロール頻度の指標として機能しないため、あれば優先して使う
        const lastJoinedAt = doc.data().last_joined_at;
        return {
          url: `${baseUrl}/kaiwai/${doc.id}`,
          lastModified: lastJoinedAt ? lastJoinedAt.toDate() : new Date(),
          changeFrequency: "daily",
          priority: 0.8,
        };
      });
  } catch (e) {
    console.error("sitemap kaiwai fetch error:", e);
  }

  let postUrls = [];
  try {
    const snap = await getDocs(collectionGroup(db, "posts"));
    postUrls = snap.docs
      .filter((doc) => {
        const authorUid = doc.ref.parent.parent?.id;
        // コメント件数はここでは見ない(全投稿分の集計クエリはコストが高いため)。
        // コメントで厚みが出ている投稿はページ自体のrobotsメタでは拾われるが、
        // sitemapには載らない(次回クロール分の取りこぼしは許容)
        return isPostIndexable({ post: doc.data(), authorUid });
      })
      .map((doc) => {
        const authorUid = doc.ref.parent.parent.id;
        const timePosted = doc.data().timePosted;
        return {
          url: `${baseUrl}/posts/${authorUid}/${doc.id}`,
          lastModified: timePosted ? timePosted.toDate() : new Date(),
          changeFrequency: "monthly",
          priority: 0.5,
        };
      });
  } catch (e) {
    console.error("sitemap posts fetch error:", e);
  }

  let businessUrls = [];
  try {
    const snap = await getDocs(collection(db, "business"));
    businessUrls = snap.docs
      .filter((doc) => isBusinessIndexable(doc.data()))
      .map((doc) => ({
        url: `${baseUrl}/business/${doc.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      }));
  } catch (e) {
    console.error("sitemap business fetch error:", e);
  }

  let eventUrls = [];
  try {
    const snap = await getDocs(collection(db, "events"));
    eventUrls = snap.docs
      .filter((doc) => isEventIndexable(doc.data()))
      .map((doc) => ({
        url: `${baseUrl}/events/${doc.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      }));
  } catch (e) {
    console.error("sitemap events fetch error:", e);
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...kaiwaiUrls,
    ...postUrls,
    ...businessUrls,
    ...eventUrls,
  ];
}
