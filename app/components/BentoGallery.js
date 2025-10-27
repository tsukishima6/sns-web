"use client";
import React, { useEffect, useState } from "react";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import { app } from "../../lib/firebase"; // ← Firebase初期化済みをimportしてね

export default function BentoGallery() {
  const [images, setImages] = useState([]);

  useEffect(() => {
    async function fetchImages() {
      try {
        const storage = getStorage(app);
        const folderRef = ref(storage, "bento-images"); // ← フォルダ名変更OK
        const result = await listAll(folderRef);

        const urls = await Promise.all(
          result.items.map((item) => getDownloadURL(item))
        );

        // ランダムに6〜8個抽出
        const shuffled = urls.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, Math.floor(Math.random() * 3) + 6); // 6〜8枚
        setImages(selected);
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    }
    fetchImages();
  }, []);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "10px",
        padding: "1rem",
        maxWidth: "1000px",
        margin: "0 auto",
      }}
    >
      {images.map((url, i) => (
        <div
          key={i}
          style={{
            position: "relative",
            borderRadius: "12px",
            overflow: "hidden",
            aspectRatio: i % 5 === 0 ? "2/1" : i % 3 === 0 ? "1/2" : "1/1",
          }}
        >
          <img
            src={url}
            alt={`bento-${i}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      ))}
    </div>
  );
}
