import { collectionGroup, query, orderBy, getDocs, getDoc, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import Image from "next/image";
import Link from "next/link";
import WordCloudSphere from "./components/WordCloudSphere";
import BentoGallery from "./components/BentoGallery";
import ParticlesBackground from "./components/ParticlesBackground";
import PostsCarousel from "./components/PostsCarousel";

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "kaiwai",
    "url": "https://kaiwai.space",
    "description": "趣味・地域・職種・・各界隈の情報にドップリ浸かる、新しい国産SNS『kaiwai』のWeb版",
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "kaiwai",
    "applicationCategory": "SocialNetworkingApplication",
    "operatingSystem": "iOS, Android",
    "url": "https://kaiwai.space",
    "description": "趣味・地域・職種・・各界隈の情報にドップリ浸かる、新しい国産SNS",
    "downloadUrl": "https://apps.apple.com/jp/app/kaiwai/id6469412765",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "JPY",
    },
  },
];

async function fetchPosts() {
  try {
    const q = query(collectionGroup(db, "posts"), orderBy("timePosted", "desc"), limit(5));
    const snap = await getDocs(q);

    const posts = await Promise.all(
      snap.docs.map(async (d) => {
        const data = d.data();
        const userID = d.ref.parent.parent?.id || null;

        let profile = null;
        if (data.postUser_profile) {
          try {
            const profileSnap = await getDoc(data.postUser_profile);
            if (profileSnap.exists()) {
              const p = profileSnap.data();
              profile = {
                id: profileSnap.id,
                name: p.name || null,
                photo: p.photo || null,
                ID: p.ID || null,
              };
            }
          } catch (e) {
            console.error("profile fetch error:", e);
          }
        }

        let kaiwaiName = "";
        let kaiwaiID = "";
        if (data.kaiwai) {
          try {
            const kaiwaiSnap = await getDoc(data.kaiwai);
            if (kaiwaiSnap.exists()) {
              kaiwaiName = kaiwaiSnap.data().name || "";
              kaiwaiID = kaiwaiSnap.id;
            }
          } catch (e) {
            console.error("kaiwai fetch error:", e);
          }
        }

        return {
          id: d.id,
          userID,
          postDescription: data.postDescription || null,
          postPhoto: data.postPhoto || null,
          timePosted: data.timePosted?.seconds || null,
          profile,
          kaiwaiName,
          kaiwaiID,
        };
      })
    );

    return posts;
  } catch (err) {
    console.error("fetch posts error:", err);
    return [];
  }
}

export default async function HomePage() {
  const posts = await fetchPosts();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 背景パーティクル */}
      <ParticlesBackground />

      <div style={{ position: "relative", zIndex: 2 }}>
        {/* コンテンツ */}
        <div
          style={{
            fontFamily: "Urbanist, 'Shippori Mincho', serif",
            maxWidth: "720px",
            padding: "0rem 0rem 2rem 0rem",
            margin: "0 auto",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div
            style={{
              position: "relative",
              marginTop: "-90px",
              marginBottom: "1.5rem",
            }}
          >
            {/* MV球: 高さ・位置を固定し、下のコンテンツ量に影響されない */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "520px", overflow: "hidden" }}>
              <WordCloudSphere />
            </div>

            {/* h1以下: 独立してオフセット調整できる通常フロー */}
            <div
              style={{
                position: "relative",
                zIndex: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                paddingTop: "260px",
              }}
            >
              <h1
                style={{
                  textAlign: "center",
                  fontWeight: 500,
                  fontSize: "1.1rem",
                  lineHeight: "1.6",
                  color: "#fff",
                  fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif",
                  margin: "0 1.5rem",
                  padding: "0.7rem 1.3rem",
                  background: "linear-gradient(135deg, rgba(21,38,53,0.75), rgba(143,168,167,0.7))",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  isolation: "isolate",
                  transform: "translateZ(0)",
                  boxShadow: "0 6px 28px rgba(21, 38, 53, 0.15)",
                }}
              >
                界隈の数だけ、SNSがあっていい。
              </h1>

              <div style={{ position: "relative", zIndex: 5, width: "100%", marginTop: "2rem" }}>
                <PostsCarousel posts={posts} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "0rem" }}>
        <BentoGallery />
      </div>
    </>
  );
}
