console.log("🔥 FIREBASE_SERVICE_ACCOUNT raw:", process.env.FIREBASE_SERVICE_ACCOUNT);
console.log("🔥 FIREBASE_SERVICE_ACCOUNT type:", typeof process.env.FIREBASE_SERVICE_ACCOUNT);
console.log("🔥 ENV keys sample:", Object.keys(process.env).slice(0, 10));

/** @type {import('next-sitemap').IConfig} */
const admin = require("firebase-admin");

let db = null;

// Firebase初期化（Vercel環境では serviceAccountKey.json がないので環境変数から読み込む）
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase initialized");
      db = admin.firestore();
    } else {
      console.log("⚠️ No FIREBASE_SERVICE_ACCOUNT found. Skipping Firestore access.");
    }
  } catch (e) {
    console.error("❌ Firebase initialization failed:", e);
  }
}

module.exports = {
  siteUrl: "https://kaiwai.vercel.app",
  generateRobotsTxt: true,
  outDir: "./public",
  robotsTxtOptions: {
    additionalSitemaps: ["https://kaiwai.vercel.app/sitemap-0.xml"],
  },

  additionalPaths: async () => {
    const urls = [];

    // Firestoreが利用可能な場合のみデータ追加
    if (db) {
      // --- kaiwai ページを追加 ---
      const kaiwaiSnap = await db.collection("kaiwai").get();
      kaiwaiSnap.forEach((doc) => {
        urls.push({
          loc: `/kaiwai/${doc.id}`,
          changefreq: "daily",
          priority: 0.8,
          lastmod: new Date().toISOString(),
        });
      });

      // --- profile ページを追加 ---
      const profileSnap = await db.collectionGroup("profile").get();
      profileSnap.forEach((doc) => {
        const userId = doc.ref.parent.parent.id;
        urls.push({
          loc: `/users/${userId}/profile/${doc.id}`,
          changefreq: "weekly",
          priority: 0.6,
          lastmod: new Date().toISOString(),
        });
      });

      // --- post ページを追加 ---
      const postSnap = await db.collectionGroup("posts").get();
      postSnap.forEach((doc) => {
        const userId = doc.ref.parent.parent.id;
        urls.push({
          loc: `/users/${userId}/posts/${doc.id}`,
          changefreq: "daily",
          priority: 0.7,
          lastmod: new Date().toISOString(),
        });
      });
    } else {
      console.log("⚠️ Skipping Firestore paths (no db initialized).");
    }

    return urls;
  },