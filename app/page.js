import { collectionGroup, query, orderBy, getDocs, getDoc, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import Image from "next/image";
import Link from "next/link";
import KaiwaiWordCloud from "./components/wordcloud";
import BentoGallery from "./components/BentoGallery";
import ParticlesBackground from "./components/ParticlesBackground";
import PostsCarousel from "./components/PostsCarousel";

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "kaiwai",
    "url": "https://kaiwai.vercel.app",
    "description": "趣味・地域・職種・・各界隈の情報にドップリ浸かる、新しい国産SNS『kaiwai』のWeb版",
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "kaiwai",
    "applicationCategory": "SocialNetworkingApplication",
    "operatingSystem": "iOS, Android",
    "url": "https://kaiwai.vercel.app",
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
            fontFamily: "'Shippori Mincho', Urbanist, serif",
            maxWidth: "720px",
            padding: "1.5rem 0rem 2rem 0rem",
            margin: "0 auto",
            position: "relative",
            zIndex: 2,
          }}
        >
          <h1
            style={{
              textAlign: "center",
              fontWeight: 500,
              fontSize: "1.1rem",
              marginBottom: "1.3rem",
              lineHeight: "1.6",
              color: "#000",
            }}
          >
            界隈の数だけ、SNSがあっていい。
          </h1>

          <div
            style={{
              background: "linear-gradient(135deg, #152635, #8fa8a7)",
              opacity: 0.85,
              borderRadius: "25px",
              padding: "1.2rem",
              marginRight: "1.6rem",
              marginLeft: "1.6rem",
              marginBottom: "1.5rem",
              fontFamily: "Noto Sans JP , Shippori Mincho, Arial, Urbanist",
            }}
          >
            <p style={{ color: "#fff", fontSize: "0.9rem", lineHeight: "1.8", textAlign: "center", margin: 0 }}>
              趣味、地域、悩み、職種・・<br />
              それぞれの界隈の情報にドップリ浸かる、<br />
              新しいSNSを作りました。
            </p>
          </div>

          <div style={{ marginTop: "0rem", marginBottom: "0rem", minHeight: "80px" }}>
            <KaiwaiWordCloud />
          </div>

          <PostsCarousel posts={posts} />
        </div>
      </div>

      <div style={{ marginTop: "0rem" }}>
        <BentoGallery />
      </div>
    </>
  );
}
