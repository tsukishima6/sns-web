import { collectionGroup, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import BusinessLikeButton from "@/app/components/BusinessLikeButton";
import FavoriteButton from "@/app/components/FavoriteButton";
import FollowBusinessButton from "@/app/components/FollowBusinessButton";
import BizReviewSection from "@/app/components/BizReviewSection";
import BizPostEntry from "@/app/components/BizPostEntry";
import { isBusinessIndexable } from "@/lib/postIndexing";

const fallbackImg =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwai_admin.png?alt=media&token=a3a36f2a-d37f-49fb-a3a6-0914f24131a8";

export async function generateMetadata({ params }) {
  const { bizID } = params;
  try {
    const snap = await getDoc(doc(db, "business", bizID));
    if (!snap.exists()) return { title: "ビジネスが見つかりません | kaiwai" };
    const biz = snap.data();
    return {
      title: `${biz.display_name || "ビジネス"} | kaiwai`,
      description: biz.discription || "",
      openGraph: { images: [biz.photo_1 || fallbackImg] },
      // noindexでもfollowはtrueにして、界隈ページ等へのリンク評価は通す
      robots: isBusinessIndexable(biz) ? { index: true, follow: true } : { index: false, follow: true },
    };
  } catch {
    return { title: "ビジネス | kaiwai" };
  }
}

export default async function BusinessDetailPage({ params }) {
  const { bizID } = params;

  const snap = await getDoc(doc(db, "business", bizID));
  if (!snap.exists()) {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-10 text-center text-gray-400 dark:text-[var(--fg-muted)]">
        ビジネス情報が見つかりません
      </div>
    );
  }

  const biz = snap.data();
  const photos = [biz.photo_1, biz.photo_2, biz.photo_3].filter(Boolean);

  const ratingList = biz.rating_list || [];
  const avgRating =
    ratingList.length > 0
      ? (ratingList.reduce((a, b) => a + b, 0) / ratingList.length).toFixed(1)
      : null;
  const favoritedCount = (biz.favorited || []).length;
  // review_displayはネイティブ(business_detail_widget.dart)ではtrueの時に
  // レビュー欄を「非表示」にするフラグとして使われている(名前と逆の意味、
  // FlutterFlow側の命名の癖)。両プラットフォームで挙動を揃える
  const showReviews = biz.review_display !== true;

  // レビュー取得(ネイティブと同じくbusinessではなくreviewer=投稿者のuser配下に
  // 平坦保存されたbizreviewをcollectionGroupクエリで取得。ネイティブ側もorderByを
  // 付けていない(reviewee単一フィールドのCOLLECTION_GROUPインデックスしか無い)ため、
  // ここでも新規の複合インデックスを避けるためorderByは付けない(並び替えは
  // BizReviewSection側でクライアント処理)
  let initialReviews = [];
  if (showReviews) {
    try {
      const reviewsSnap = await getDocs(
        query(collectionGroup(db, "bizreview"), where("reviewee", "==", doc(db, "business", bizID)))
      );
      initialReviews = await Promise.all(
        reviewsSnap.docs.map(async (d) => {
          const data = d.data();
          let reviewerName = "";
          let reviewerPhoto = "";
          if (data.reviewer) {
            try {
              const uSnap = await getDoc(data.reviewer);
              if (uSnap.exists()) {
                reviewerName = uSnap.data().display_name || "";
                reviewerPhoto = uSnap.data().photo_url || "";
              }
            } catch {}
          }
          return {
            id: d.id,
            reviewerName,
            reviewerPhoto,
            rating: data.rating || 0,
            reviewComment: data.review_comment || "",
            timestamp: data.timestamp
              ? { seconds: data.timestamp.seconds, nanoseconds: data.timestamp.nanoseconds }
              : null,
          };
        })
      );
    } catch (err) {
      console.error("reviews fetch error:", err);
    }
  }

  // 店舗として投稿された投稿一覧(post.asbiz == この店舗)。ネイティブ
  // (business_dposts_widget.dart)と同じくorderByありのクエリ(本番に既にある
  // 複合インデックス[asbiz ASC, timePosted DESC]をそのまま使い回せる)
  let bizPosts = [];
  try {
    const bizPostsSnap = await getDocs(
      query(
        collectionGroup(db, "posts"),
        where("asbiz", "==", doc(db, "business", bizID)),
        orderBy("timePosted", "desc")
      )
    );
    bizPosts = bizPostsSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        userID: d.ref.parent.parent?.id || null,
        postDescription: data.postDescription || "",
        postPhoto: data.postPhoto || "",
        timePosted: data.timePosted ? { seconds: data.timePosted.seconds, nanoseconds: data.timePosted.nanoseconds } : null,
      };
    });
  } catch (err) {
    console.error("biz posts fetch error:", err);
  }

  let relatedEvents = [];
  if (biz.events?.length > 0) {
    relatedEvents = (
      await Promise.all(
        biz.events.slice(0, 10).map(async (evRef) => {
          try {
            const evSnap = await getDoc(evRef);
            return evSnap.exists() ? { id: evSnap.id, ...evSnap.data() } : null;
          } catch {
            return null;
          }
        })
      )
    ).filter(Boolean);
  }

  const socials = [
    { label: "Website", url: biz.website, icon: "🌐" },
    { label: "Instagram", url: biz.instagram ? `https://instagram.com/${biz.instagram.replace("@", "")}` : null, icon: "📷" },
    { label: "Twitter / X", url: biz.twitter ? `https://x.com/${biz.twitter.replace("@", "")}` : null, icon: "🐦" },
    { label: "Facebook", url: biz.facebook, icon: "📘" },
  ].filter((s) => s.url);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": biz.display_name,
    "description": biz.discription || undefined,
    "image": photos[0] || fallbackImg,
    "url": `https://kaiwai.vercel.app/business/${bizID}`,
    ...(biz.location_adress ? { "address": { "@type": "PostalAddress", "streetAddress": biz.location_adress } } : {}),
    ...(avgRating ? { "aggregateRating": { "@type": "AggregateRating", "ratingValue": avgRating, "reviewCount": ratingList.length } } : {}),
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <div className="max-w-[960px] mx-auto">
      {/* カバー画像 */}
      {photos[0] && (
        <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
          <img
            src={photos[0]}
            alt={biz.display_name}
            className="w-full h-full object-cover"
          />
          <Link
            href="/"
            className="absolute top-4 left-4 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
        </div>
      )}

      <div className="px-4 py-6 space-y-5">
        {/* 名前 */}
        <div>
          <h1
            className="text-xl font-bold text-gray-800 dark:text-[var(--fg-primary)]"
            style={{ fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif" }}
          >
            {biz.display_name}
          </h1>
          {biz.subname && (
            <p className="text-sm text-gray-400 dark:text-[var(--fg-muted)] mt-0.5"
               style={{ fontFamily: "'Urbanist', sans-serif" }}>
              {biz.subname}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1.5">
            {showReviews && avgRating && (
              <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-[var(--fg-secondary)]">
                ⭐ {avgRating}
                <span className="text-xs text-gray-400 dark:text-[var(--fg-muted)]">({ratingList.length})</span>
              </span>
            )}
            {favoritedCount > 0 && (
              <span className="flex items-center gap-1 text-sm text-gray-600 dark:text-[var(--fg-secondary)]">
                ♡ {favoritedCount}
              </span>
            )}
          </div>

          {/* いいね・お気に入り・フォロー */}
          <div className="flex items-center gap-4 mt-3">
            <BusinessLikeButton bizID={bizID} />
            <FavoriteButton targetPath={`business/${bizID}`} fieldName="favorited" />
            <FollowBusinessButton bizID={bizID} />
          </div>

          {/* 引用して投稿・店舗として投稿 */}
          <div className="mt-3">
            <BizPostEntry
              bizID={bizID}
              bizName={biz.display_name}
              ownerUID={biz.owner?.id || null}
              memberUIDs={(biz.members || []).map((r) => r.id)}
            />
          </div>
          {biz.categories?.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-2">
              {biz.categories.map((c, i) => (
                <span key={i} className="text-xs text-[#8fa8a7] border border-[#8fa8a7] px-2.5 py-0.5 rounded-full">
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 説明 */}
        {biz.discription && (
          <p className="text-sm text-gray-700 dark:text-[var(--fg-secondary)] leading-relaxed whitespace-pre-wrap"
             style={{ fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif" }}>
            {biz.discription}
          </p>
        )}

        {/* 基本情報 */}
        <div className="bg-gray-50 dark:bg-[var(--surface-muted)] rounded-2xl p-4 space-y-3">
          {biz.location_name && (
            <div className="flex gap-3 text-sm">
              <span className="text-gray-400 dark:text-[var(--fg-muted)] flex-shrink-0">📍</span>
              <div>
                <p className="text-xs text-gray-400 dark:text-[var(--fg-muted)] mb-0.5">場所</p>
                <p className="text-gray-700 dark:text-[var(--fg-secondary)]">{biz.location_name}</p>
              </div>
            </div>
          )}
          {biz.location_adress && (
            <div className="flex gap-3 text-sm">
              <span className="text-gray-400 dark:text-[var(--fg-muted)] flex-shrink-0">🏠</span>
              <div>
                <p className="text-xs text-gray-400 dark:text-[var(--fg-muted)] mb-0.5">住所</p>
                <p className="text-gray-700 dark:text-[var(--fg-secondary)]">{biz.location_adress}</p>
              </div>
            </div>
          )}
          {biz.fee && (
            <div className="flex gap-3 text-sm">
              <span className="text-gray-400 dark:text-[var(--fg-muted)] flex-shrink-0">💴</span>
              <div>
                <p className="text-xs text-gray-400 dark:text-[var(--fg-muted)] mb-0.5">料金</p>
                <p className="text-gray-700 dark:text-[var(--fg-secondary)]">{biz.fee}</p>
              </div>
            </div>
          )}
          {biz.bizhour && (
            <div className="flex gap-3 text-sm">
              <span className="text-gray-400 dark:text-[var(--fg-muted)] flex-shrink-0">🕒</span>
              <div>
                <p className="text-xs text-gray-400 dark:text-[var(--fg-muted)] mb-0.5">営業時間</p>
                <p className="text-gray-700 dark:text-[var(--fg-secondary)] whitespace-pre-wrap">{biz.bizhour}</p>
              </div>
            </div>
          )}
        </div>

        {/* サブ画像 */}
        {photos.length > 1 && (
          <div className="grid grid-cols-2 gap-2">
            {photos.slice(1).map((src, i) => (
              <img key={i} src={src} alt="" className="w-full aspect-square object-cover rounded-xl" />
            ))}
          </div>
        )}

        {/* SNS・外部リンク */}
        {socials.length > 0 && (
          <div className="space-y-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 border border-gray-200 dark:border-[var(--border-subtle)] rounded-xl text-sm text-gray-700 dark:text-[var(--fg-secondary)] hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)] transition-colors"
                style={{ textDecoration: "none" }}
              >
                <span>{s.icon}</span>
                <span>{s.label}</span>
                <svg className="ml-auto text-gray-300 dark:text-[var(--fg-muted)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            ))}
          </div>
        )}

        {/* 関連イベント */}
        {relatedEvents.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-[var(--fg-secondary)] mb-2" style={{ fontFamily: "'Urbanist', sans-serif" }}>
              events
            </h2>
            <div className="space-y-2">
              {relatedEvents.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/events/${ev.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 border border-gray-100 dark:border-[var(--border-subtle)] rounded-xl hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)] transition-colors"
                  style={{ textDecoration: "none" }}
                >
                  <img
                    src={ev.event_photo || fallbackImg}
                    alt={ev.event_title || ""}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                  <p className="text-sm text-gray-700 dark:text-[var(--fg-secondary)] line-clamp-2" style={{ fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif" }}>
                    {ev.event_title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 店舗としての投稿 */}
        {bizPosts.length > 0 && (
          <div>
            <h2
              className="text-sm font-semibold text-gray-500 dark:text-[var(--fg-secondary)] mb-2"
              style={{ fontFamily: "'Urbanist', sans-serif" }}
            >
              posts
            </h2>
            <div className="space-y-2">
              {bizPosts.map((p) => (
                <Link
                  key={p.id}
                  href={`/posts/${p.userID}/${p.id}`}
                  className="block px-3 py-2.5 border border-gray-100 dark:border-[var(--border-subtle)] rounded-xl hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)] transition-colors"
                  style={{ textDecoration: "none" }}
                >
                  {p.postPhoto && (
                    <img src={p.postPhoto} alt="" className="w-full rounded-lg object-cover mb-2 max-h-60" />
                  )}
                  {p.postDescription?.trim() && (
                    <p
                      className="text-sm text-gray-700 dark:text-[var(--fg-secondary)] whitespace-pre-wrap"
                      style={{ fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif" }}
                    >
                      {p.postDescription}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* レビュー */}
        {showReviews && <BizReviewSection bizID={bizID} initialReviews={initialReviews} />}
      </div>
    </div>
    </>
  );
}
