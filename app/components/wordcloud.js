"use client";
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function KaiwaiWordCloud() {
  const [names, setNames] = useState([]);

  useEffect(() => {
    async function fetchKaiwai() {
      const snap = await getDocs(collection(db, "kaiwai"));
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const visible = all.filter((x) => x.noindex !== true);
      const random = visible.sort(() => 0.5 - Math.random()).slice(0, 20);
      setNames(random.map((x) => x.name));
    }
    fetchKaiwai();
  }, []);

  // 🎨 5種類のランダムフォント
  const randomFontFamily = () => {
    const fonts = [
      "'Urbanist', sans-serif",
      "'Shippori Mincho', serif",
      "'Montserrat', sans-serif",
      "'Noto Sans JP', sans-serif",
      "'Hina Mincho', serif",
      "'Zen Antique', serif",
      "'Klee One', cursive",
    ];
    return fonts[Math.floor(Math.random() * fonts.length)];
  };

  // 色・サイズ
  const randomColor = () => {
    const hues = [200, 280, 340, 30, 150];
    const hue = hues[Math.floor(Math.random() * hues.length)];
    return `hsl(${hue}, 60%, ${45 + Math.random() * 20}%)`;
  };

  const randomFontSize = () => 11 + Math.random() * 17;

  // 位置ロジック
  const generatePositions = (count) => {
    const positions = [];
    const maxAttempts = 200;
    const containerWidth = 720;
    const containerHeight = 120;

    for (let i = 0; i < count; i++) {
      const fontSize = randomFontSize();
      const orientation =
        Math.random() < 0.2 ? "vertical-rl" : "horizontal-tb";
      let x, y;
      let attempts = 0;
      let overlap = false;

      do {
        overlap = false;
        x = Math.random() * (containerWidth - fontSize * 5);
        y = Math.random() * (containerHeight - fontSize * 2);

        for (const prev of positions) {
          const buffer = 8;
          if (
            x < prev.x + prev.w + buffer &&
            x + fontSize * 5 > prev.x - buffer &&
            y < prev.y + prev.h + buffer &&
            y + fontSize * 2 > prev.y - buffer
          ) {
            overlap = true;
            break;
          }
        }

        attempts++;
      } while (overlap && attempts < maxAttempts);

      positions.push({
        x,
        y,
        fontSize,
        orientation,
      });
    }

    return positions;
  };

  const positions = generatePositions(names.length);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "120px",
        overflow: "hidden",
      }}
    >
      {names.map((name, i) => {
        const p = positions[i];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: p?.y ?? 0,
              left: p?.x ?? 0,
              fontSize: `${p?.fontSize ?? 14}px`,
              color: randomColor(),
              writingMode: p?.orientation ?? "horizontal-tb",
              fontWeight: 500,
              whiteSpace: "nowrap",
              opacity: 0.9,
              fontFamily: randomFontFamily(), // ← 🎯追加！
            }}
          >
            {name}
          </div>
        );
      })}
    </div>
  );
}
