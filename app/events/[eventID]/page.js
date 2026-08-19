import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import EventLikeButton from "@/app/components/EventLikeButton";
import EventJoinButton from "@/app/components/EventJoinButton";
import FavoriteButton from "@/app/components/FavoriteButton";
import { isEventIndexable } from "@/lib/postIndexing";

const fallbackImg =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwai_admin.png?alt=media&token=a3a36f2a-d37f-49fb-a3a6-0914f24131a8";

function formatDate(ts) {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function generateMetadata({ params }) {
  const { eventID } = params;
  try {
    const snap = await getDoc(doc(db, "events", eventID));
    if (!snap.exists()) return { title: "イベントが見つかりません | kaiwai" };
    const ev = snap.data();
    return {
      title: `${ev.event_title || "イベント"} | kaiwai`,
      description: ev.event_description || "",
      openGraph: { images: [ev.event_photo || fallbackImg] },
      // noindexでもfollowはtrueにして、界隈ページ等へのリンク評価は通す
      robots: isEventIndexable(ev) ? { index: true, follow: true } : { index: false, follow: true },
    };
  } catch {
    return { title: "イベント | kaiwai" };
  }
}

export default async function EventDetailPage({ params }) {
  const { eventID } = params;

  const snap = await getDoc(doc(db, "events", eventID));
  if (!snap.exists()) {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-10 text-center text-gray-400 dark:text-[var(--fg-muted)]">
        イベントが見つかりません
      </div>
    );
  }

  const ev = snap.data();

  let kaiwaiName = "";
  let kaiwaiID = "";
  if (ev.kaiwai) {
    try {
      const kSnap = await getDoc(ev.kaiwai);
      if (kSnap.exists()) {
        kaiwaiName = kSnap.data().name || "";
        kaiwaiID = kSnap.id;
      }
    } catch {}
  }

  const photos = [ev.event_photo, ev.event_photo2, ev.event_photo3, ev.event_photo4].filter(Boolean);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    "name": ev.event_title,
    "description": ev.event_description || undefined,
    "startDate": ev.event_schedule ? ev.event_schedule.toDate().toISOString() : undefined,
    "endDate": ev.event_end ? ev.event_end.toDate().toISOString() : undefined,
    "eventStatus": "https://schema.org/EventScheduled",
    "image": photos[0] || fallbackImg,
    "url": `https://kaiwai.vercel.app/events/${eventID}`,
    ...(ev.event_location
      ? {
          "location": {
            "@type": "Place",
            "name": ev.event_location,
            "address": ev.event_locationadress || undefined,
          },
        }
      : {}),
  };

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <div className="max-w-[960px] mx-auto">
      {/* ヘッダー画像 */}
      <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
        <img
          src={photos[0] || fallbackImg}
          alt={ev.event_title}
          className="w-full h-full object-cover"
        />
        <Link
          href="/events"
          className="absolute top-4 left-4 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
      </div>

      <div className="px-4 py-6 space-y-5">
        {/* 界隈タグ */}
        {kaiwaiName && (
          <Link href={`/kaiwai/${kaiwaiID}`}
            className="inline-block text-xs text-[#8fa8a7] border border-[#8fa8a7] px-3 py-0.5 rounded-full"
            style={{ textDecoration: "none", fontFamily: "'Urbanist', sans-serif" }}>
            {kaiwaiName}
          </Link>
        )}

        {/* タイトル */}
        <div>
          <h1
            className="text-xl font-bold text-gray-800 dark:text-[var(--fg-primary)] leading-snug mb-1"
            style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
          >
            {ev.event_title}
          </h1>
          {ev.event_subtitle && (
            <p className="text-sm text-gray-500 dark:text-[var(--fg-secondary)]"
               style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              {ev.event_subtitle}
            </p>
          )}
        </div>

        {/* 参加・いいね・お気に入り */}
        <div className="flex items-center gap-4">
          <EventJoinButton eventID={eventID} />
          <EventLikeButton eventID={eventID} />
          <FavoriteButton targetPath={`events/${eventID}`} fieldName="favorited" />
        </div>

        {/* 基本情報 */}
        <div className="bg-gray-50 dark:bg-[var(--surface-muted)] rounded-2xl p-4 space-y-3">
          {ev.event_schedule && (
            <InfoRow icon={<CalIcon />} label="開催日時" value={formatDate(ev.event_schedule)} />
          )}
          {ev.event_end && (
            <InfoRow icon={<CalIcon />} label="終了" value={formatDate(ev.event_end)} />
          )}
          {ev.event_location && (
            <InfoRow icon={<PinIcon />} label="場所" value={ev.event_location} />
          )}
          {ev.event_locationadress && (
            <InfoRow icon={<PinIcon />} label="住所" value={ev.event_locationadress} />
          )}
          {ev.event_fee && (
            <InfoRow icon={<FeeIcon />} label="参加費" value={ev.event_fee} />
          )}
        </div>

        {/* 説明 */}
        {ev.event_description && (
          <div>
            <h2 className="text-sm font-semibold text-gray-600 dark:text-[var(--fg-secondary)] mb-2"
                style={{ fontFamily: "'Urbanist', sans-serif" }}>
              詳細
            </h2>
            <p className="text-sm text-gray-700 dark:text-[var(--fg-secondary)] leading-relaxed whitespace-pre-wrap"
               style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              {ev.event_description}
            </p>
          </div>
        )}

        {/* 注意事項 */}
        {ev.event_notice && (
          <div>
            <h2 className="text-sm font-semibold text-gray-600 dark:text-[var(--fg-secondary)] mb-2"
                style={{ fontFamily: "'Urbanist', sans-serif" }}>
              注意事項
            </h2>
            <p className="text-sm text-gray-500 dark:text-[var(--fg-secondary)] leading-relaxed whitespace-pre-wrap"
               style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              {ev.event_notice}
            </p>
          </div>
        )}

        {/* サブ画像 */}
        {photos.length > 1 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.slice(1).map((src, i) => (
              <img key={i} src={src} alt="" className="w-full aspect-square object-cover rounded-xl" />
            ))}
          </div>
        )}

        {/* 外部リンク */}
        {ev.event_URL && (
          <a
            href={ev.event_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 dark:border-[var(--border-subtle)] text-sm text-gray-700 dark:text-[var(--fg-secondary)] hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)] transition-colors"
            style={{ textDecoration: "none" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            詳細・申し込みページへ
          </a>
        )}
      </div>
    </div>
    </>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex gap-3">
      <span className="text-gray-400 dark:text-[var(--fg-muted)] flex-shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 dark:text-[var(--fg-muted)] mb-0.5"
           style={{ fontFamily: "'Urbanist', sans-serif" }}>{label}</p>
        <p className="text-sm text-gray-700 dark:text-[var(--fg-secondary)]"
           style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{value}</p>
      </div>
    </div>
  );
}

function CalIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function FeeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
