import {
  doc,
  getDoc,
  collection,
  collectionGroup,
  query,
  where,
  orderBy,
  getDocs,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import Image from "next/image";
import Link from "next/link";
import PageHeader from "../../../components/PageHeader";
import WordCloudSphere from "../../../components/WordCloudSphere";
import CommentSection from "../../../components/CommentSection";
import LikeButton from "../../../components/LikeButton";
import FavoriteButton from "../../../components/FavoriteButton";
import RepostButton from "../../../components/RepostButton";
import RepostEmbed from "../../../components/RepostEmbed";
import NewsQuoteEmbed from "../../../components/NewsQuoteEmbed";
import BizPostBadge from "../../../components/BizPostBadge";
import BizQuoteEmbed from "../../../components/BizQuoteEmbed";
import { isPostIndexable } from "../../../../lib/postIndexing";

// fallback画像
const fallbackProfilePhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";
const fallbackOGP =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kaiwai_admin.png?alt=media&token=a3a36f2a-d37f-49fb-a3a6-0914f24131a8";

// 動的メタデータ生成（OGP用）
export async function generateMetadata({ params }) {
  const { userID, postID } = params;
  const postRef = doc(db, "users", userID, "posts", postID);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) {
    return { title: "投稿が見つかりません | KAIWAI" };
  }

  const post = postSnap.data();
  const ogImage = post.postPhoto || fallbackOGP;

  // 投稿者プロフィール取得
  let profileData = null;
  let profileID = "";
  if (post.postUser_profile) {
    const profileSnap = await getDoc(post.postUser_profile);
    if (profileSnap.exists()) {
      profileData = profileSnap.data();
      profileID = post.postUser_profile.id; // ← profileID取得
    }
  }

  // kaiwai の name を取得
  let kaiwaiName = "";
  if (post.kaiwai) {
    const kaiwaiSnap = await getDoc(post.kaiwai);
    if (kaiwaiSnap.exists()) {
      kaiwaiName = kaiwaiSnap.data().name || "";
    }
  }

  const description =
    `${profileData?.name || "ユーザー"}：${post.postDescription?.trim() || ""} @${kaiwaiName}kaiwai`;

  // コメントが付いていれば内容が薄くても厚みがあるとみなす(件数のみ、集計クエリなので低コスト)
  const commentCountSnap = await getCountFromServer(
    query(collectionGroup(db, "postcomments"), where("post", "==", postRef))
  );
  const commentCount = commentCountSnap.data().count;

  const indexable = isPostIndexable({ post, authorUid: userID, commentCount });

  return {
    title: post.postDescription?.trim() || "KAIWAI 投稿",
    description,
    openGraph: {
      title: post.postDescription?.trim() || "KAIWAI 投稿",
      description,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: post.postDescription?.trim() || "KAIWAI 投稿",
      description,
      images: [ogImage],
    },
    // noindexでもfollowはtrueにして、界隈ページ等へのリンク評価は通す
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function PostPage({ params }) {
  const { userID, postID } = params;

  // 投稿取得
  const postRef = doc(db, "users", userID, "posts", postID);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) {
    return <div style={{ padding: "2rem", fontSize: "1.5rem", color: "var(--fg-primary)" }}>投稿が見つかりません</div>;
  }

  const post = postSnap.data();

  // 投稿者プロフィール取得
  let profileData = null;
  let profileID = "";
  if (post.postUser_profile) {
    const profileSnap = await getDoc(post.postUser_profile);
    if (profileSnap.exists()) {
      profileData = profileSnap.data();
      profileID = post.postUser_profile.id; // ← profileID取得
    }
  }

  // kaiwai の name を取得
  let kaiwaiName = "";
  if (post.kaiwai) {
    const kaiwaiSnap = await getDoc(post.kaiwai);
    if (kaiwaiSnap.exists()) {
      kaiwaiName = kaiwaiSnap.data().name || "";
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${y}年${m}月${d}日 ${h}:${min}`;
  };

  // リポスト元投稿を取得(post.repostが元投稿へのDocumentReference)
  let repostedPost = null;
  if (post.repost) {
    const originalSnap = await getDoc(post.repost);
    if (originalSnap.exists()) {
      const originalData = originalSnap.data();
      const originalUserID = originalSnap.ref.parent.parent?.id || null;
      let originalProfile = null;
      if (originalData.postUser_profile) {
        const opSnap = await getDoc(originalData.postUser_profile);
        if (opSnap.exists()) {
          // RepostEmbed(クライアントコンポーネント)へ渡すのはnameとphotoのみに絞る。
          // opSnap.data()をそのままspreadすると、profileが持つkaiwai(DocumentReference)
          // フィールドまで含まれてしまい、RSC境界を越える際にNext.jsが循環参照を持つ
          // Firestore SDK内部オブジェクトをシリアライズしようとして
          // "Maximum call stack size exceeded"で落ちる(DocumentReferenceは
          // クライアントコンポーネントへpropsで直接渡せない、というCLAUDE.mdの注意点の一種)
          const opData = opSnap.data();
          originalProfile = { name: opData.name || "", photo: opData.photo || "" };
        }
      }
      repostedPost = {
        id: originalSnap.id,
        userID: originalUserID,
        postDescription: originalData.postDescription || "",
        postPhoto: originalData.postPhoto || "",
        // Timestampはクライアントコンポーネント(RepostEmbed)へプレーンな値でしか渡せない
        timePosted: originalData.timePosted
          ? { seconds: originalData.timePosted.seconds, nanoseconds: originalData.timePosted.nanoseconds }
          : null,
        profile: originalProfile,
      };
    }
  }

  // ニュース引用元を取得(post.quote_newsが元ニュースへのDocumentReference)
  let quotedNews = null;
  if (post.quote_news) {
    const newsSnap = await getDoc(post.quote_news);
    if (newsSnap.exists()) {
      const newsData = newsSnap.data();
      quotedNews = {
        id: newsSnap.id,
        kaiwaiId: newsSnap.ref.parent.parent?.id || null,
        title: newsData.title || "",
        sitename: newsData.sitename || "",
        img: newsData.img || "",
        // Timestampはクライアントコンポーネント(NewsQuoteEmbed)へプレーンな値でしか渡せない
        time: newsData.time ? { seconds: newsData.time.seconds, nanoseconds: newsData.time.nanoseconds } : null,
      };
    }
  }

  // 店舗として投稿(post.asbiz)/店舗引用(post.quote_biz)の取得
  let asBizInfo = null;
  if (post.asbiz) {
    const bizSnap = await getDoc(post.asbiz);
    if (bizSnap.exists()) {
      const bizData = bizSnap.data();
      asBizInfo = { id: bizSnap.id, name: bizData.display_name || "", photo: bizData.photo_1 || "" };
    }
  }
  let quotedBiz = null;
  if (post.quote_biz) {
    const bizSnap = await getDoc(post.quote_biz);
    if (bizSnap.exists()) {
      const bizData = bizSnap.data();
      quotedBiz = {
        id: bizSnap.id,
        name: bizData.display_name || "",
        subname: bizData.subname || "",
        photo: bizData.photo_1 || "",
      };
    }
  }

  // 他の投稿を取得
  let otherPosts = [];
  if (profileData && post.postUser_profile) {
    const userPostsRef = collection(db, "users", userID, "posts");
    const q = query(
      userPostsRef,
      where("postUser_profile", "==", post.postUser_profile),
      orderBy("timePosted", "desc")
    );
    const otherPostsSnap = await getDocs(q);
    otherPosts = otherPostsSnap.docs
      .filter((doc) => doc.id !== postID)
      .map((doc) => ({ id: doc.id, ...doc.data() }));
  }

  // コメントをサーバー側で取得してSSRする(クライアント取得だとクローラーから見て
  // 本文がほぼ空のページになり、内容の薄いページとして評価されてしまうため)
  const commentsQuery = query(
    collectionGroup(db, "postcomments"),
    where("post", "==", postRef),
    orderBy("timePosted", "asc")
  );
  const commentsSnap = await getDocs(commentsQuery);
  const initialComments = await Promise.all(
    commentsSnap.docs.map(async (commentDoc) => {
      const data = commentDoc.data();
      let commentProfile = null;
      if (data.commentuser_pf) {
        try {
          const pfSnap = await getDoc(data.commentuser_pf);
          if (pfSnap.exists()) {
            const pf = pfSnap.data();
            commentProfile = { name: pf.name || null, photo: pf.photo || null };
          }
        } catch (_) {}
      }
      return {
        id: commentDoc.id,
        comment: data.comment || "",
        // Timestampはクライアントコンポーネントへプレーンな値でしか渡せない
        timePosted: data.timePosted
          ? { seconds: data.timePosted.seconds, nanoseconds: data.timePosted.nanoseconds }
          : null,
        userID: data.user?.id || null,
        profile: commentProfile,
      };
    })
  );

  return (
    <>
      <PageHeader kaiwaiName={kaiwaiName} kaiwaiID={post.kaiwai?.id ?? ""} />


      {/* コンテンツ */}
      <div style={{ paddingTop: "120px" }}>
        {/* メイン投稿カード */}
        <div
    style={{
      margin: "0 auto",
      padding: "1.3rem 1rem" ,
      borderBottom: "1px solid var(--border-subtle)",
      backgroundColor: "transparent",
      fontFamily: "Urbanist, sans-serif",
      position: "relative",
    }}
  >
          {/* 投稿者情報(店舗として投稿された場合は店舗バッジに差し替え) */}
          {post.asbiz ? (
            <BizPostBadge bizID={asBizInfo?.id} bizName={asBizInfo?.name} bizPhoto={asBizInfo?.photo} />
          ) : (
            profileData && (
              <Link href={`/users/${userID}/profile/${profileID}`} style={{ textDecoration: "none" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem", cursor: "pointer" }}>
                  <img
                    src={profileData.photo || fallbackProfilePhoto}
                    alt={profileData.name || "ユーザー"}
                    style={{ width: "48px", height: "48px", borderRadius: "50%", marginRight: "0.75rem" }}
                  />
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: "500", fontSize: "0.95rem", color: "var(--fg-primary)" }}>
                      {profileData.name}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "var(--fg-secondary)", fontFamily: "Urbanist" }}>
                      @{profileData.ID || userID}
                    </span>
                  </div>
                </div>
              </Link>
            )
          )}

          {/* 投稿タイトル */}
          <h1
      style={{
        fontSize: "1rem",
        fontWeight: "400",
        marginBottom: post.postPhoto ? "1rem" : "1.6rem",
        color: "var(--fg-primary)",
        marginLeft: "0.2rem",
        marginRight: "1.2rem",
　　　　 fontFamily: "Urbanist",
      }}
    >
      {post.postDescription?.trim() ? post.postDescription : null}
    </h1>

          {/* リポスト元の埋め込み表示 */}
          {post.repost && <RepostEmbed repostedPost={repostedPost} />}

          {/* ニュース引用の埋め込み表示 */}
          {post.quote_news && <NewsQuoteEmbed quotedNews={quotedNews} />}

          {/* 店舗引用の埋め込み表示 */}
          {post.quote_biz && <BizQuoteEmbed quotedBiz={quotedBiz} />}

          {/* 投稿写真 */}
    {post.postPhoto && (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "93%", marginBottom: "1rem" }}>
        {[post.postPhoto, post.postphoto2, post.postphoto3].filter(Boolean).map((src, i) => (
          <img key={i} src={src} alt="投稿画像" style={{ width: "100%" }} />
        ))}
      </div>
    )}

    {/* 投稿本文 */}
    {post.postContent && (
      <p style={{ fontFamily: "Urbanist", fontWeight: "400", fontSize: "0.95rem", lineHeight: "1.6", color: "var(--fg-secondary)", marginRight: "1.8rem"}}>{post.postContent}</p>
    )}

    {/* 投稿日時 */}
{post.timePosted && (
  <div
    style={{
      marginTop: "0.5rem",
      fontSize: "1rem",
      color: "var(--fg-muted)",
      fontFamily: "'Urbanist','Montserrat',sans-serif",
      textAlign: "right",   // ← 追加
      marginRight: "2.4rem",

    }}
  >
    {formatTime(post.timePosted)}
  </div>
)}

    {/* いいね・お気に入り */}
    <div style={{ marginTop: "0.75rem", display: "flex", gap: "1rem" }}>
      <LikeButton postUserID={userID} postID={postID} kaiwaiPath={post.kaiwai?.path ?? null} />
      <FavoriteButton targetPath={`users/${userID}/posts/${postID}`} fieldName="users_favorited" />
      <RepostButton postPath={`users/${userID}/posts/${postID}`} kaiwaiPath={post.kaiwai?.path ?? null} />
    </div>
  </div>

        {/* コメントセクション */}
        <CommentSection
          postUserID={userID}
          postID={postID}
          kaiwaiPath={post.kaiwai?.path ?? null}
          initialComments={initialComments}
        />

        {/* 他の投稿 */}
{profileData && (
  <div style={{ marginTop: "2.2rem", padding: "0 0rem" }}>
    <Link href={`/users/${userID}/profile/${profileID}`} style={{ textDecoration: "none" }}>
      <div style={{ textAlign: "center", marginBottom: "1rem", cursor: "pointer" }}>
        <h3
          style={{
            fontSize: "0.95rem",
            fontWeight: "500",
            color: "var(--fg-primary)",
            margin: 0,
          }}
        >
          {profileData.name} の他の投稿
        </h3>
      </div>
    </Link>

    {/* 投稿一覧 */}
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {otherPosts.map((other, idx) => {
        let formattedOtherTime = "";
        if (other.timePosted) {
          const date = other.timePosted.toDate();
          formattedOtherTime = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        }

        return (
          <div
            key={idx}
            style={{
              padding: "1.3rem 1rem",
              borderBottom: "1px solid var(--border-subtle)",
              backgroundColor: "transparent",
            }}
          >
            {/* 投稿者情報 */}
            <Link href={`/users/${userID}/profile/${profileID}`} style={{ textDecoration: "none" }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "0.5rem", cursor: "pointer" }}>
                <img
                  src={profileData.photo || fallbackProfilePhoto}
                  alt={profileData.name || "ユーザー"}
                  style={{ width: "48px", height: "48px", borderRadius: "50%", marginRight: "0.75rem" }}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: "500", fontSize: "0.95rem", color: "var(--fg-primary)", fontFamily: "Urbanist" }}>
                    {profileData.name}
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "var(--fg-secondary)", fontFamily: "Urbanist" }}>
                    @{profileData.ID || userID}
                  </span>
                </div>
              </div>
            </Link>

            {/* 投稿内容 */}
            <Link
              href={`/posts/${userID}/${other.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <h4
                style={{
                  fontSize: "0.95rem",
                  fontWeight: "400",
                  marginBottom: other.postPhoto ? "1rem" : "1.5rem",
                  color: "var(--fg-primary)",
                  marginRight: "1.8rem",
                  fontFamily: "Urbanist",
                }}
              >
                {other.postDescription}
              </h4>

              {other.postPhoto && (
                <img
                  src={other.postPhoto}
                  alt="投稿画像"
                  style={{
                    width: "100%",
                    marginBottom: "1rem",
                  }}
                />
              )}

              {other.postContent && (
                <p
                  style={{
                    fontSize: "0.9rem",
                    lineHeight: "1.6",
                    color: "var(--fg-secondary)",
                  }}
                >
                  {other.postContent}
                </p>
              )}

              {/* 🔹 投稿日時（右寄せ） */}
              <div
                style={{
                  marginTop: "0.5rem",
                  fontSize: "1rem",
                  color: "var(--fg-muted)",
                  textAlign: "right",
                  fontFamily: "'Urbanist','Montserrat',sans-serif",
                  marginRight: "2.4rem",
                }}
              >
                {formattedOtherTime}
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  </div>
)}
</div>

{/* 🔻 ブランド紹介セクション */}
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
  <div
    style={{
      backdropFilter: "blur(0px)",
      WebkitBackdropFilter: "blur(0px)",
      padding: "2.2rem 0",
    }}
  >
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "0 1.4rem",
        textAlign: "left",
        color: "var(--fg-primary)",
      }}
    >
      <p style={{ margin: 0, fontSize: "1.0rem", lineHeight: "1.6", letterSpacing: "0.02em", fontFamily: "Noto Sans JP, Arial", color: "var(--fg-primary)" }}>
        界隈の数だけ、snsがあっていい。
      </p>
      <h2
        style={{
          margin: "0.4rem 0 1.1rem",
          fontSize: "2.5rem",
          fontWeight: 700,
          fontFamily: "'Urbanist','Montserrat',sans-serif",
          background: "linear-gradient(135deg, #152635, #8fa8a7)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          lineHeight: 1.1,
        }}
      >
        kaiwai
      </h2>
      <p style={{ margin: "0 0 0.9rem", fontSize: "0.90rem", lineHeight: "1.9", letterSpacing: "0.02em", fontFamily: "Noto Sans JP, Arial", whiteSpace: "pre-line" }}>
        趣味、地域、職種、悩み・・{"\n"}各界隈のユーザーが集う国産SNS。
      </p>
      <p style={{ margin: 0, fontSize: "0.90rem", lineHeight: "1.9", letterSpacing: "0.02em", fontFamily: "Noto Sans JP, Arial", whiteSpace: "pre-line" }}>
        {kaiwaiName}だけではありません。{"\n"}界隈は自由に追加・切り替え。{"\n"}ご自身で界隈を立ち上げ、{"\n"}メンバーを募ることも。
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
