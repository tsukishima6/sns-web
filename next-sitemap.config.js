/** @type {import('next-sitemap').IConfig} */
const admin = require('firebase-admin');

// Firebase初期化（Vercel環境では serviceAccountKey.json がないので環境変数から読み込む）
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

module.exports = {
  siteUrl: 'https://kaiwai.vercel.app',
  generateRobotsTxt: true,
robotsTxtOptions: {
  additionalSitemaps: [
    'https://kaiwai.vercel.app/sitemap-0.xml',
  ],
},

  additionalPaths: async (config) => {
    const urls = [];

    // --- kaiwai ページを追加 ---
    const kaiwaiSnap = await db.collection('kaiwai').get();
    kaiwaiSnap.forEach((doc) => {
      urls.push({
        loc: `/kaiwai/${doc.id}`,
        changefreq: 'daily',
        priority: 0.8,
        lastmod: new Date().toISOString(),
      });
    });

    // --- profile ページを追加 ---
    const profileSnap = await db.collectionGroup('profile').get();
    profileSnap.forEach((doc) => {
      const userId = doc.ref.parent.parent.id; // users/{userId}/profile/{profileId}
      urls.push({
        loc: `/users/${userId}/profile/${doc.id}`,
        changefreq: 'weekly',
        priority: 0.6,
        lastmod: new Date().toISOString(),
      });
    });

    // --- post ページを追加 ---
    const postSnap = await db.collectionGroup('posts').get();
    postSnap.forEach((doc) => {
      const userId = doc.ref.parent.parent.id; // users/{userId}/posts/{postId}
      urls.push({
        loc: `/users/${userId}/posts/${doc.id}`,
        changefreq: 'daily',
        priority: 0.7,
        lastmod: new Date().toISOString(),
      });
    });

    return urls;
  },
};
