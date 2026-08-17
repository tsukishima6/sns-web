"use client";

import { useEffect, useState } from "react";
import { getDoc } from "firebase/firestore";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

// Firestoreルール(isKaiwaiEditByCreator())は「呼び出し元のusers.nowprofile自体が
// この界隈のmaster:trueプロフィールであること」を要求する(全profileの横断検索ではない)。
// UIの表示条件をこれとズレさせると「編集リンクは出るが保存時にpermission-deniedになる」
// 事態になるため、ここでも必ずnowprofileだけを見る
export default function KaiwaiEditLink({ kaiwaiID }) {
  const { user, userDoc } = useAuth();
  const [isMaster, setIsMaster] = useState(false);

  useEffect(() => {
    if (!user || !userDoc?.nowprofile) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(userDoc.nowprofile);
        if (cancelled || !snap.exists()) return;
        const prof = snap.data();
        setIsMaster(prof.master === true && prof.kaiwai?.id === kaiwaiID);
      } catch (_) {}
    })();
    return () => {
      cancelled = true;
    };
  }, [user, userDoc?.nowprofile, kaiwaiID]);

  if (!isMaster) return null;

  return (
    <div style={{ textAlign: "center", marginTop: "0.4rem" }}>
      <Link
        href={`/kaiwai/${kaiwaiID}/edit`}
        style={{
          fontSize: "0.8rem",
          color: "var(--fg-muted)",
          textDecoration: "underline",
          fontFamily: "'Urbanist', sans-serif",
        }}
      >
        この界隈を編集
      </Link>
    </div>
  );
}
