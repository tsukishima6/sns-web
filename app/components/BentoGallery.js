"use client";
import React, { useEffect, useState } from "react";
import { getStorage, ref, listAll, getDownloadURL } from "firebase/storage";
import app from "../../lib/firebase";

export default function BentoGallery() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null); // ← クリックされた画像

  useEffect(() => {
    async function fetchImages() {
      try {
        const storage = getStorage(app);
        const folderRef = ref(storage, "bento");
        const result = await listAll(folderRef);
        const urls = await Promise.all(result.items.map((item) => getDownloadURL(item)));

        // 画像をランダムに6枚選択
        const shuffled = urls.sort(() => 0.5 - Math.random());
        setImages(shuffled.slice(0, 6));
      } catch (error) {
        console.error("Error fetching images:", error);
      }
    }
    fetchImages();
  }, []);

  return (
    <>
      {/* グリッド表示 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gridTemplateRows: "repeat(3, 200px)",
          gridTemplateAreas: `
            "a b b"
            "c b b"
            "d e f"
          `,
          gap: "12px",
          padding: "0.4rem",
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        {images[0] && (
          <div style={{ gridArea: "a" }}>
            <BentoItem url={images[0]} onClick={() => setSelectedImage(images[0])} />
          </div>
        )}
        {images[1] && (
          <div style={{ gridArea: "b" }}>
            <BentoItem url={images[1]} onClick={() => setSelectedImage(images[1])} />
          </div>
        )}
        {images[2] && (
          <div style={{ gridArea: "c" }}>
            <BentoItem url={images[2]} onClick={() => setSelectedImage(images[2])} />
          </div>
        )}
        {images[3] && (
          <div style={{ gridArea: "d" }}>
            <BentoItem url={images[3]} onClick={() => setSelectedImage(images[3])} />
          </div>
        )}
        {images[4] && (
          <div style={{ gridArea: "e" }}>
            <BentoItem url={images[4]} onClick={() => setSelectedImage(images[4])} />
          </div>
        )}
        {images[5] && (
          <div style={{ gridArea: "f" }}>
            <BentoItem url={images[5]} onClick={() => setSelectedImage(images[5])} />
          </div>
        )}
      </div>

      {/* フルスクリーン表示 */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            cursor: "zoom-out",
          }}
        >
          <img
            src={selectedImage}
            alt=""
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              objectFit: "contain",
              filter: "none", // カラー表示
            }}
          />
        </div>
      )}
    </>
  );
}

// 個々のBentoアイテム
function BentoItem({ url, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "13px",
        overflow: "hidden",
        transition: "transform 0.3s ease, filter 0.3s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <img
        src={url}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "grayscale(100%)", // モノクロ化
          transition: "filter 0.3s ease",
        }}
      />
    </div>
  );
}
