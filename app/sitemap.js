import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

export default async function sitemap() {
  const baseUrl = "https://kaiwai.vercel.app";

  let kaiwaiUrls = [];
  try {
    const snap = await getDocs(collection(db, "kaiwai"));
    kaiwaiUrls = snap.docs
      .filter((doc) => doc.data().noindex !== true)
      .map((doc) => ({
        url: `${baseUrl}/kaiwai/${doc.id}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      }));
  } catch (e) {
    console.error("sitemap kaiwai fetch error:", e);
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    ...kaiwaiUrls,
  ];
}
