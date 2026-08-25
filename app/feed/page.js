"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
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
import { useSignupPrompt } from "@/lib/SignupPromptContext";
import Link from "next/link";
import LikeButton from "../components/LikeButton";
import FavoriteButton from "../components/FavoriteButton";
import RepostButton from "../components/RepostButton";
import RepostEmbed from "../components/RepostEmbed";
import NewsQuoteEmbed from "../components/NewsQuoteEmbed";
import BizPostBadge from "../components/BizPostBadge";
import BizQuoteEmbed from "../components/BizQuoteEmbed";

const fallbackPhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";

export default function FeedPage() {
  const { user, userDoc, loading } = useAuth();
  const { openSignupPrompt } = useSignupPrompt();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      openSignupPrompt();
      router.push("/");
      return;
    }
    fetchFeed();
  }, [user, userDoc, loading]);

  async function fetchFeed() {
    setFetching(true);
    try {
      const kaiwaiList = userDoc?.kaiwai_list || [];
      if (kaiwaiList.length === 0) {
        setPosts([]);
        setFetching(false);
        return;
      }

      const q = query(
        collectionGroup(db, "posts"),
        where("kaiwai", "in", kaiwaiList.slice(0, 10)),
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

          if (data.repost) {
            try {
              const originalSnap = await getDoc(data.repost);
              if (originalSnap.exists()) {
                const originalData = originalSnap.data();
                const originalUserID = originalSnap.ref.parent.parent?.id || null;
                let originalProfile = null;
                if (originalData.postUser_profile) {
                  try {
                    const opSnap = await getDoc(originalData.postUser_profile);
                    if (opSnap.exists()) {
                      originalProfile = { id: opSnap.id, ...opSnap.data() };
                    }
                  } catch {}
                }
                post.repostedPost = {
                  id: originalSnap.id,
                  userID: originalUserID,
                  postDescription: originalData.postDescription || "",
                  postPhoto: originalData.postPhoto || "",
                  timePosted: originalData.timePosted || null,
                  profile: originalProfile,
                };
              }
            } catch {}
          }

          if (data.quote_news) {
            try {
              const newsSnap = await getDoc(data.quote_news);
              if (newsSnap.exists()) {
                const newsData = newsSnap.data();
                const kaiwaiId = newsSnap.ref.parent.parent?.id || null;
                post.quotedNews = {
                  id: newsSnap.id,
                  kaiwaiId,
                  title: newsData.title || "",
                  sitename: newsData.sitename || "",
                  img: newsData.img || "",
                  time: newsData.time || null,
                };
              }
            } catch {}
          }

          if (data.asbiz) {
            try {
              const bizSnap = await getDoc(data.asbiz);
              if (bizSnap.exists()) {
                const bizData = bizSnap.data();
                post.asBizInfo = {
                  id: bizSnap.id,
                  name: bizData.display_name || "",
                  photo: bizData.photo_1 || "",
                };
              }
            } catch {}
          }

          if (data.quote_biz) {
            try {
              const bizSnap = await getDoc(data.quote_biz);
              if (bizSnap.exists()) {
                const bizData = bizSnap.data();
                post.quotedBiz = {
                  id: bizSnap.id,
                  name: bizData.display_name || "",
                  subname: bizData.subname || "",
                  photo: bizData.photo_1 || "",
                };
              }
            } catch {}
          }
          return post;
        })
      );

      setPosts(postsData.filter((p) => p.profile));
    } catch (err) {
      console.error("feed fetch error:", err);
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

  if (posts.length === 0) {
    return (
      <div className="max-w-[960px] mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-[var(--fg-secondary)] text-sm mb-4">
          フィードに表示する投稿がありません。
        </p>
        <p className="text-gray-400 dark:text-[var(--fg-muted)] text-xs">
          アプリから界隈に参加すると投稿が表示されます。
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[960px] mx-auto">
      <div>
        {posts.map((post) => (
          <PostCard key={`${post.userID}-${post.id}`} post={post} />
        ))}
      </div>
    </div>
  );
}

function PostCard({ post }) {
  const formatTime = (timestamp) => {
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
  };

  return (
    <Link
      href={`/posts/${post.userID}/${post.id}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <div className="px-4 py-4 border-b border-gray-100 dark:border-[var(--border-subtle)] hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)] transition-colors">
        {/* プロフィール行(店舗として投稿された場合は店舗バッジに差し替え) */}
        {post.asbiz ? (
          <BizPostBadge bizID={post.asBizInfo?.id} bizName={post.asBizInfo?.name} bizPhoto={post.asBizInfo?.photo} />
        ) : (
          post.profile && (
            <div className="flex items-center gap-3 mb-3">
              <img
                src={post.profile.photo || fallbackPhoto}
                alt={post.profile.name || "ユーザー"}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-[var(--fg-primary)] truncate">
                  {post.profile.name}
                </p>
                <p className="text-xs text-gray-400 dark:text-[var(--fg-muted)]">
                  @{post.profile.ID || post.userID}
                </p>
              </div>
            </div>
          )
        )}

        {/* 本文 */}
        {post.postDescription?.trim() && (
          <p className="text-sm text-gray-700 dark:text-[var(--fg-secondary)] mb-3 leading-relaxed whitespace-pre-wrap">
            {post.postDescription}
          </p>
        )}

        {/* 画像 */}
        {post.postPhoto && (
          <div className="flex gap-2 mb-3">
            {[post.postPhoto, post.postphoto2, post.postphoto3].filter(Boolean).map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="flex-1 min-w-0 rounded-xl object-cover max-h-80"
              />
            ))}
          </div>
        )}

        {/* リポスト元の埋め込み表示 */}
        {post.repost && <RepostEmbed repostedPost={post.repostedPost} />}

        {/* ニュース引用の埋め込み表示 */}
        {post.quote_news && <NewsQuoteEmbed quotedNews={post.quotedNews} />}

        {/* 店舗引用の埋め込み表示 */}
        {post.quote_biz && <BizQuoteEmbed quotedBiz={post.quotedBiz} />}

        {/* 時刻・いいね */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-[var(--fg-muted)]">{formatTime(post.timePosted)}</span>
          <div className="flex items-center gap-3">
            <LikeButton postUserID={post.userID} postID={post.id} kaiwaiPath={post.kaiwai?.path ?? null} />
            <FavoriteButton
              targetPath={`users/${post.userID}/posts/${post.id}`}
              fieldName="users_favorited"
            />
            <RepostButton
              postPath={`users/${post.userID}/posts/${post.id}`}
              kaiwaiPath={post.kaiwai?.path ?? null}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
