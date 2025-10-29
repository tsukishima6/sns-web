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

      // ランダムに20件ほど選ぶ
      const random = all.sort(() => 0.5 - Math.random()).slice(0, 20);
      setNames(random.map((x) => x.name));
    }

    fetchKaiwai();
  }, []);

  // 柔らかい色
  const randomColor = () => {
    const hues = [200, 280, 340, 30, 150];
    const hue = hues[Math.floor(Math.random() * hues.length)];
    return `hsl(${hue}, 60%, ${45 + Math.random() * 20}%)`;
  };

  const randomFontSize = () => 11 + Math.random() * 17;

  // 配置ロジック（重なり防止）
  const generatePositions = (count) => {
    const positions = [];
    const maxAttempts = 200;
    const containerWidth = 720; // px（親divに合わせて）
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
            }}
          >
            {name}
          </div>
        );
      })}
    </div>
  );
}
