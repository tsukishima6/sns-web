"use client";
import React, { useEffect, useRef, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

const FONTS = [
  "var(--font-urbanist), sans-serif",
  "var(--font-shippori-mincho), serif",
  "var(--font-montserrat), sans-serif",
  "var(--font-noto-sans-jp), sans-serif",
  "var(--font-zen-antique), serif",
  "var(--font-klee-one), cursive",
];

const COLORS = ["#152635", "#2f4f4f", "#4682b4", "#8fa8a7", "#db7093"];

const WORD_COUNT = 40;
const RADIUS = 190;
const FOCAL = 580;

// フィボナッチ球面配置: 球の表面に均等に点を散らす
function fibonacciSphere(n, radius) {
  const points = [];
  const offset = 2 / n;
  const increment = Math.PI * (3 - Math.sqrt(5)); // 黄金角
  for (let i = 0; i < n; i++) {
    const y = i * offset - 1 + offset / 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * increment;
    points.push({
      x: Math.cos(phi) * r * radius,
      y: y * radius,
      z: Math.sin(phi) * r * radius,
    });
  }
  return points;
}

export default function WordCloudSphere() {
  const [words, setWords] = useState([]);
  const containerRef = useRef(null);
  const nodeRefs = useRef([]);
  const pointsRef = useRef([]);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    async function fetchKaiwai() {
      try {
        const snap = await getDocs(collection(db, "kaiwai"));
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const visible = all.filter((x) => x.noindex !== true && x.name);
        const shuffled = visible.sort(() => 0.5 - Math.random());
        setWords(shuffled.slice(0, WORD_COUNT).map((x) => x.name));
      } catch (e) {
        console.error("wordcloud sphere fetch error:", e);
      }
    }
    fetchKaiwai();
  }, []);

  useEffect(() => {
    if (words.length === 0) return;
    pointsRef.current = fibonacciSphere(words.length, RADIUS);

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const handlePointerMove = (e) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      pointerRef.current = {
        x: (e.clientX - rect.left) / rect.width - 0.5,
        y: (e.clientY - rect.top) / rect.height - 0.5,
      };
    };
    window.addEventListener("mousemove", handlePointerMove);

    let angleY = 0;
    let raf;
    let lastTime = performance.now();
    const speed = reduceMotion ? 0 : 0.00025;

    function tick(now) {
      const dt = now - lastTime;
      lastTime = now;
      angleY += speed * dt;

      // オートローテーション + マウス位置による視差(パララックス)
      const totalY = angleY + pointerRef.current.x * 0.4;
      const totalX = 0.15 + pointerRef.current.y * 0.4;

      const cosY = Math.cos(totalY);
      const sinY = Math.sin(totalY);
      const cosX = Math.cos(totalX);
      const sinX = Math.sin(totalX);

      pointsRef.current.forEach((p, i) => {
        const node = nodeRefs.current[i];
        if (!node) return;

        const x1 = p.x * cosY + p.z * sinY;
        const z1 = -p.x * sinY + p.z * cosY;
        const y1 = p.y;

        const y2 = y1 * cosX - z1 * sinX;
        const z2 = y1 * sinX + z1 * cosX;
        const x2 = x1;

        const scale = FOCAL / (FOCAL + z2);
        const t = (z2 + RADIUS) / (2 * RADIUS); // 0=手前 1=奥

        node.style.transform = `translate3d(${x2 * scale}px, ${y2 * scale}px, 0) translate(-50%, -50%) scale(${scale})`;
        node.style.opacity = String(1 - t * 0.75);
        node.style.zIndex = String(Math.round(1000 - z2));
      });

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", handlePointerMove);
    };
  }, [words]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {words.map((word, i) => (
        <div
          key={i}
          ref={(el) => (nodeRefs.current[i] = el)}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            fontSize: "1rem",
            fontWeight: 500,
            whiteSpace: "nowrap",
            color: COLORS[i % COLORS.length],
            fontFamily: FONTS[i % FONTS.length],
            willChange: "transform, opacity",
          }}
        >
          {word}
        </div>
      ))}
    </div>
  );
}
