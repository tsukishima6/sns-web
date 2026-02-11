console.log("🚀 Generating LITE sitemap...");

const admin = require("firebase-admin");

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://kaiwai.vercel.app",
  generateRobotsTxt: false, // robots.txtはfull側で生成する想定
  outDir: "./public",
  sitemapIndexFileName: "sitemap.xml",
  sitemapFilename: "sitemap-lite.xml",

  additionalPaths: async () => {
    const urls = [];

    // 🔹 トップページ
    urls.push({
      loc: `/`,
      changefreq: "daily",
      priority: 1.0,
      lastmod: new Date().toISOString(),
    });

    // 🔹 FIREBASE_SERVICE_ACCOUNT が無い環境では落とさず終了
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log("⚠️ No FIREBASE_SERVICE_ACCOUNT found. Skipping kaiwai paths.");
      return urls;
    }

    // 🔹 Firebase Admin 初期化（多重初期化防止）
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("✅ Firebase initialized (lite)");
    }

    const db = admin.firestore();

    // 🔹 kaiwai ページ（トップレベル kaiwai コレクション）
    const kaiwaiSnap = await db.collection("kaiwai").get();
    kaiwaiSnap.forEach((doc) => {
      urls.push({
        loc: `/kaiwai/${doc.id}`,
        changefreq: "daily",
        priority: 0.8,
        lastmod: new Date().toISOString(),
      });
    });

    return urls;
  },
};
