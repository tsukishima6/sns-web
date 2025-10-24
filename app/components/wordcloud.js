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

      // ランダムに10件選ぶ
      const random = all.sort(() => 0.5 - Math.random()).slice(0, 19);
      setNames(random.map((x) => x.name));
    }

    fetchKaiwai();
  }, []);

  // ランダム色生成（やさしめトーン）
  const randomColor = () => {
    const hues = [200, 280, 340, 30, 150]; // 青〜ピンク系など
    const hue = hues[Math.floor(Math.random() * hues.length)];
    return `hsl(${hue}, 60%, ${40 + Math.random() * 30}%)`;
  };

  // ランダムフォントサイズ
  const randomFontSize = () => `${11 + Math.random() * 17}px`;

  // ランダム位置
  const randomPos = () => ({
    top: `${Math.random() * 80}%`,
    left: `${Math.random() * 80}%`,
  });

  // ランダム縦書き（20%の確率で）
  const randomOrientation = () =>
    Math.random() < 0.2 ? "vertical-rl" : "horizontal-tb";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "120px",
        overflow: "hidden",
        background: "#0000000",
      }}
    >
      {names.map((name, i) => {
        const pos = randomPos();
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              fontSize: randomFontSize(),
              color: randomColor(),
              writingMode: randomOrientation(),
              transform: `rotate(${Math.random() * 10 - 5}deg)`,
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
