/** @type {import('next-sitemap').IConfig} */
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

// Firebaseサービスアカウントキーを読み込み
const serviceAccountPath = path.resolve(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Firebase サービスアカウントキー (serviceAccountKey.json) が見つかりません。');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Firebase初期化（重複防止）
if (!global.firebaseApp) {
  global.firebaseApp = initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

module.exports = {
  siteUrl: 'https://kaiwai.vercel.app',
  generateRobotsTxt: true,

  additionalPaths: async (config) => {
    const urls = [];

    // --- kaiwai ページを追加 ---
    const kaiwaiSnap = await db.collection('kaiwai').get();
    kaiwaiSnap.forEach((doc) => {
      urls.push({
        loc: `/kaiwai/${doc.id}`,
        changefreq: 'daily',
        priority: 0.8,
      });
    });

    // --- profile ページを追加 ---
    const profileSnap = await db.collectionGroup('profile').get();
    profileSnap.forEach((doc) => {
      const userId = doc.ref.parent.parent.id;
      urls.push({
        loc: `/users/${userId}/profile/${doc.id}`,
        changefreq: 'weekly',
        priority: 0.6,
      });
    });

    // --- post ページを追加 ---
    const postSnap = await db.collectionGroup('posts').get();
    postSnap.forEach((doc) => {
      const userId = doc.ref.parent.parent.id;
      urls.push({
        loc: `/users/${userId}/posts/${doc.id}`,
        changefreq: 'daily',
        priority: 0.7,
      });
    });

    return urls;
  },
};
