"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";
import LikeButton from "../components/LikeButton";
import FavoriteButton from "../components/FavoriteButton";

const fallbackPhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";

export default function FavoritesPage() {
  const { user, userDoc, loading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [events, setEvents] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (userDoc) fetchFavorites();
  }, [user, userDoc, loading]);

  async function fetchFavorites() {
    setFetching(true);
    try {
      const profileRef = userDoc?.nowprofile;
      if (!profileRef) {
        setPosts([]);
        setProfiles([]);
        setEvents([]);
        setBusinesses([]);
        setFetching(false);
        return;
      }

      const q = query(
        collectionGroup(db, "posts"),
        where("users_favorited", "array-contains", profileRef),
        orderBy("timePosted", "desc"),
        limit(30)
      );
      const snap = await getDocs(q);

      const postsData = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          const userID = d.ref.parent.parent?.id || null;
          const post = { id: d.id, userID, ...data };

          if (data.postUser_profile) {
            try {
              const profileSnap = await getDoc(data.postUser_profile);
              if (profileSnap.exists()) {
                post.profile = { id: profileSnap.id, ...profileSnap.data() };
              }
            } catch {}
          }
          return post;
        })
      );

      setPosts(postsData.filter((p) => p.profile));

      if (userDoc?.kaiwai) {
        // お気に入りユーザー
        try {
          const profSnap = await getDocs(
            query(
              collectionGroup(db, "profile"),
              where("kaiwai", "==", userDoc.kaiwai),
              where("users_favorited", "array-contains", profileRef)
            )
          );
          setProfiles(
            profSnap.docs
              .filter((d) => d.ref.path !== profileRef.path)
              .map((d) => ({
                id: d.id,
                userID: d.ref.parent.parent?.id || null,
                ...d.data(),
              }))
          );
        } catch (e) {
          console.error("favorite profiles fetch error:", e);
        }

        // お気に入りイベント
        try {
          const evSnap = await getDocs(
            query(
              collection(db, "events"),
              where("kaiwai", "==", userDoc.kaiwai),
              where("favorited", "array-contains", profileRef)
            )
          );
          setEvents(evSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (e) {
          console.error("favorite events fetch error:", e);
        }

        // お気に入りビジネス・ストア
        try {
          const bizSnap = await getDocs(
            query(
              collection(db, "business"),
              where("kaiwai", "==", userDoc.kaiwai),
              where("favorited", "array-contains", profileRef)
            )
          );
          setBusinesses(bizSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (e) {
          console.error("favorite businesses fetch error:", e);
        }
      } else {
        setProfiles([]);
        setEvents([]);
        setBusinesses([]);
      }
    } catch (e) {
      console.error("favorites fetch error:", e);
    } finally {
      setFetching(false);
    }
  }

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 dark:text-[var(--fg-muted)] text-sm">読み込み中...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-4 py-4 border-b border-gray-100 dark:border-[var(--border-subtle)]">
        <h1
          className="text-base font-medium text-gray-800 dark:text-[var(--fg-primary)]"
          style={{ fontFamily: "'Urbanist', sans-serif" }}
        >
          favorites
        </h1>
      </div>

      {profiles.length > 0 && (
        <FavSection title="users">
          {profiles.map((p) => (
            <Link
              key={`${p.userID}-${p.id}`}
              href={`/users/${p.userID}/profile/${p.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)] transition-colors"
            >
              <img
                src={p.photo || fallbackPhoto}
                alt={p.name || "ユーザー"}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-[var(--fg-primary)] truncate" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                  {p.name}
                </p>
                <p className="text-xs text-gray-400 dark:text-[var(--fg-muted)]" style={{ fontFamily: "'Urbanist', sans-serif" }}>
                  @{p.ID || p.userID}
                </p>
              </div>
            </Link>
          ))}
        </FavSection>
      )}

      {events.length > 0 && (
        <FavSection title="events">
          {events.map((ev) => (
            <Link
              key={ev.id}
              href={`/events/${ev.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)] transition-colors"
            >
              <img
                src={ev.event_photo || fallbackPhoto}
                alt={ev.event_title || ""}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
              />
              <p className="text-sm font-medium text-gray-800 dark:text-[var(--fg-primary)] line-clamp-2" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                {ev.event_title}
              </p>
            </Link>
          ))}
        </FavSection>
      )}

      {businesses.length > 0 && (
        <FavSection title="business">
          {businesses.map((biz) => (
            <Link
              key={biz.id}
              href={`/business/${biz.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)] transition-colors"
            >
              <img
                src={biz.photo_1 || fallbackPhoto}
                alt={biz.display_name || ""}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
              />
              <p className="text-sm font-medium text-gray-800 dark:text-[var(--fg-primary)] line-clamp-2" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                {biz.display_name}
              </p>
            </Link>
          ))}
        </FavSection>
      )}

      {(profiles.length > 0 || events.length > 0 || businesses.length > 0) && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-[var(--border-subtle)]">
          <h2 className="text-xs font-semibold text-gray-400 dark:text-[var(--fg-muted)] tracking-widest" style={{ fontFamily: "'Urbanist', sans-serif" }}>
            posts
          </h2>
        </div>
      )}

      {posts.length === 0 ? (
        profiles.length === 0 && events.length === 0 && businesses.length === 0 && (
          <div className="text-center py-16 px-4">
            <p className="text-gray-400 dark:text-[var(--fg-muted)] text-sm">お気に入りがありません</p>
            <p className="text-xs text-gray-300 dark:text-[var(--fg-muted)] mt-2">投稿・ユーザー・イベント・ビジネスをお気に入りするとここに表示されます</p>
          </div>
        )
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard key={`${post.userID}-${post.id}`} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

function FavSection({ title, children }) {
  return (
    <div className="border-b border-gray-100 dark:border-[var(--border-subtle)]">
      <div className="px-4 pt-3">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-[var(--fg-muted)] tracking-widest" style={{ fontFamily: "'Urbanist', sans-serif" }}>
          {title}
        </h2>
      </div>
      <div>{children}</div>
    </div>
  );
}

function PostCard({ post }) {
  function formatTime(timestamp) {
    if (!timestamp) return "";
    const date = timestamp.seconds
      ? new Date(timestamp.seconds * 1000)
      : timestamp.toDate?.();
    if (!date) return "";
    return date.toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <Link
      href={`/posts/${post.userID}/${post.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="px-4 py-4 border-b border-gray-100 dark:border-[var(--border-subtle)] hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)] transition-colors">
        {post.profile && (
          <div className="flex items-center gap-3 mb-3">
            <img
              src={post.profile.photo || fallbackPhoto}
              alt={post.profile.name || "ユーザー"}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-[var(--fg-primary)] truncate"
                 style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                {post.profile.name}
              </p>
              <p className="text-xs text-gray-400 dark:text-[var(--fg-muted)]"
                 style={{ fontFamily: "'Urbanist', sans-serif" }}>
                @{post.profile.ID || post.userID}
              </p>
            </div>
          </div>
        )}

        {post.postDescription && (
          <p className="text-sm text-gray-700 dark:text-[var(--fg-secondary)] mb-3 leading-relaxed whitespace-pre-wrap"
             style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
            {post.postDescription}
          </p>
        )}

        {post.postPhoto && (
          <img
            src={post.postPhoto}
            alt=""
            className="w-full rounded-xl mb-3 object-cover max-h-80"
          />
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-[var(--fg-muted)]">{formatTime(post.timePosted)}</span>
          <div className="flex items-center gap-3">
            <LikeButton postUserID={post.userID} postID={post.id} kaiwaiPath={post.kaiwai?.path ?? null} />
            <FavoriteButton
              targetPath={`users/${post.userID}/posts/${post.id}`}
              fieldName="users_favorited"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
