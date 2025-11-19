module.exports = {
  siteUrl: "https://kaiwai.vercel.app",
  generateRobotsTxt: false, // ここでは robots.txt は作らない
  outDir: "./public", // 出力先は同じでOK

  additionalPaths: async () => {
    const urls = [];

    // 🔹 トップページだけ
    urls.push({
      loc: `/`,
      changefreq: "daily",
      priority: 1.0,
      lastmod: new Date().toISOString(),
    });

    // 🔹 kaiwai ページだけ
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
