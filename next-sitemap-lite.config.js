console.log("🚀 Generating LITE sitemap...");


module.exports = {
  siteUrl: "https://kaiwai.vercel.app",
  generateRobotsTxt: false, // robots.txtはここでは生成しない
  outDir: "./public", // 出力先は同じでOK
  sitemapFilename: "sitemap-lite.xml", // ← 軽量版のファイル名を明示！

  additionalPaths: async () => {
    const urls = [];

    // 🔹 トップページ
    urls.push({
      loc: `/`,
      changefreq: "daily",
      priority: 1.0,
      lastmod: new Date().toISOString(),
    });

    // 🔹 kaiwai ページ
    const admin = require("firebase-admin");
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    const db = admin.firestore();
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
