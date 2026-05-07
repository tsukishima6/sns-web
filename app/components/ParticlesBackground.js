"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function ParticlesBackground() {
  const [inited, setInited] = useState(false);
  const particlesRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
      if (mounted) setInited(true);
    }).catch((e) => {
      console.error("initParticlesEngine error:", e);
      if (mounted) setInited(false);
    });
    return () => { mounted = false; };
  }, []);

  const options = {
    background: { color: { value: "#ffffff" } },
    fullScreen: { enable: false },
    fpsLimit: 60,
    particles: {
      number: { value: 80, density: { enable: true, area: 800 } },
      color: { value: ["#2f4f4f", "#db7093", "#4682b4"] },
      shape: { type: "circle" },
      opacity: { value: 0.75 },
      size: { value: { min: 1, max: 3 } },
      move: {
        enable: true,
        speed: 0.8,
        direction: "none",
        outModes: { default: "out" },
      },
      links: {
        enable: true,
        distance: 120,
        color: "#9aa4b2",
        opacity: 0.65,
        width: 1,
      },
    },
    detectRetina: true,
  };

  if (!inited || typeof document === "undefined") return null;

  return createPortal(
    <div
      id="page-particles"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100%",
        zIndex: -9999,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <Particles id="page-particles" options={options} ref={particlesRef} />
    </div>,
    document.body
  );
}
