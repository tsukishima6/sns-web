"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { useSignupPrompt } from "@/lib/SignupPromptContext";
import { joinKaiwai } from "@/lib/kaiwaiJoin";
import { compressImageFile } from "@/lib/compressImage";

const fallbackPhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";

// ネイティブ含め全新規サインアップの既定の着地先kaiwai
// (「アカウントを作成したばかりのユーザーがひとまず集う"ビギナーズ"界隈です」と
// kaiwai自身の説明文にも明記されている、kaiwai-web/CLAUDE.md参照)
const DEFAULT_KAIWAI_ID = "000htmz";

// サインアップ直後に表示する簡易オンボーディング。
// web版は署名直後kaiwai_listが空のままフィードに直行し何も表示されない
// (kaiwai-web/CLAUDE.md記載の既知のギャップ)問題への対応として、
// (1)デフォルトkaiwaiへ自動参加させ、(2)プロフィール写真設定、
// (3)興味のある他のkaiwaiへの参加を任意で促す。何度訪れても副作用が
// 重複しないよう(自動参加は参加済みならスキップ)冪等に作ってある。
export default function OnboardingPage() {
  const { user, userDoc, loading } = useAuth();
  const { openSignupPrompt } = useSignupPrompt();
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [name, setName] = useState("");
  const [currentPhoto, setCurrentPhoto] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileRef = useRef(null);

  const [defaultJoinDone, setDefaultJoinDone] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [joinedIds, setJoinedIds] = useState(new Set());
  const [joiningId, setJoiningId] = useState(null);
  // Reactの開発時StrictMode(useEffectを一度マウント→アンマウント→再マウントする)や
  // 高速な再レンダリングでeffectが2回走ると、userDoc.kaiwai_listがまだ更新されていない
  // タイミングで両方とも「未参加」と判定し、profile重複作成+参加投稿重複という実害の
  // ある二重実行になることを実機で確認した(2026-08-19)。setState経由のガードは非同期の
  // 反映待ちで間に合わないため、同期的に確定するrefで一度きりに制限する
  const autoJoinAttemptedRef = useRef(false);
  const suggestionJoinInFlightRef = useRef(new Set());

  useEffect(() => {
    if (loading) return;
    if (!user) {
      openSignupPrompt();
      router.push("/");
    }
  }, [user, loading]);

  // プロフィールの現在値を読み込む
  useEffect(() => {
    if (!user) return;
    (async () => {
      const profileRef = userDoc?.nowprofile || doc(db, "users", user.uid, "profile", user.uid);
      try {
        const snap = await getDoc(profileRef);
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || userDoc?.display_name || "");
          setCurrentPhoto(data.photo || "");
        } else {
          setName(userDoc?.display_name || "");
        }
      } catch (e) {
        console.error("onboarding profile load error:", e);
      }
    })();
  }, [user, userDoc]);

  // デフォルトkaiwai(ビギナーズ)へ未参加なら自動参加させ、空のフィードに
  // 着地するのを防ぐ(ネイティブのデフォルト割当と同等の挙動)
  useEffect(() => {
    if (!user || !userDoc || defaultJoinDone) return;
    const alreadyMember = (userDoc.kaiwai_list || []).some((r) => r.id === DEFAULT_KAIWAI_ID);
    if (alreadyMember) {
      setDefaultJoinDone(true);
      return;
    }
    if (autoJoinAttemptedRef.current) return;
    autoJoinAttemptedRef.current = true;
    (async () => {
      try {
        const kaiwaiRef = doc(db, "kaiwai", DEFAULT_KAIWAI_ID);
        const kaiwaiSnap = await getDoc(kaiwaiRef);
        const kaiwaiName = kaiwaiSnap.exists() ? kaiwaiSnap.data().name || "ビギナーズ" : "ビギナーズ";
        await joinKaiwai({ uid: user.uid, userDoc, kaiwaiRef, kaiwaiName });
      } catch (e) {
        console.error("default kaiwai auto join error:", e);
      } finally {
        setDefaultJoinDone(true);
      }
    })();
  }, [user, userDoc, defaultJoinDone]);

  // おすすめkaiwai(公式一覧の上位、デフォルトkaiwaiは除く)を取得
  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, "kaiwai"), orderBy("number", "desc"), limit(30));
        const snap = await getDocs(q);
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((k) => !k.closed && !k.noindex && k.id !== DEFAULT_KAIWAI_ID)
          .slice(0, 8);
        setSuggestions(list);
      } catch (e) {
        console.error("kaiwai suggestions fetch error:", e);
      }
    })();
  }, []);

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSaveProfile() {
    if (!user) return;
    setSavingProfile(true);
    try {
      const profileRef = userDoc?.nowprofile || doc(db, "users", user.uid, "profile", user.uid);
      let photoURL = currentPhoto;
      if (imageFile) {
        const compressed = await compressImageFile(imageFile);
        const ext = compressed.name.split(".").pop();
        const storageRef = ref(storage, `users/${user.uid}/profile_${Date.now()}.${ext}`);
        await uploadBytes(storageRef, compressed);
        photoURL = await getDownloadURL(storageRef);
      }
      await updateDoc(profileRef, { name: (name || "").trim() || "名無し", photo: photoURL });
    } catch (e) {
      console.error("onboarding profile save error:", e);
    } finally {
      setSavingProfile(false);
      setStep(2);
    }
  }

  async function handleJoinSuggestion(kaiwai) {
    if (!user || joiningId) return;
    // setJoiningIdの反映(再レンダリングでボタンがdisabledになる)を待たずに連打されると
    // 二重参加になり得るため、setStateとは別にrefで即座にガードする
    if (suggestionJoinInFlightRef.current.has(kaiwai.id)) return;
    suggestionJoinInFlightRef.current.add(kaiwai.id);
    setJoiningId(kaiwai.id);
    try {
      const kaiwaiRef = doc(db, "kaiwai", kaiwai.id);
      await joinKaiwai({ uid: user.uid, userDoc, kaiwaiRef, kaiwaiName: kaiwai.name });
      setJoinedIds((prev) => new Set(prev).add(kaiwai.id));
    } catch (e) {
      console.error("onboarding suggestion join error:", e);
      suggestionJoinInFlightRef.current.delete(kaiwai.id);
    } finally {
      setJoiningId(null);
    }
  }

  function handleFinish() {
    // userDoc(nowprofile/kaiwai_list)はAuthContextで購読していないため、
    // フィード等に確実に反映させるためフルリロードで遷移する
    window.location.href = "/feed";
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 dark:text-[var(--fg-muted)] text-sm">読み込み中...</p>
      </div>
    );
  }

  const displayPhoto = imagePreview || currentPhoto || fallbackPhoto;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className={`h-1.5 w-10 rounded-full ${step >= 1 ? "bg-black dark:bg-white" : "bg-gray-200 dark:bg-[var(--surface-muted)]"}`} />
        <div className={`h-1.5 w-10 rounded-full ${step >= 2 ? "bg-black dark:bg-white" : "bg-gray-200 dark:bg-[var(--surface-muted)]"}`} />
      </div>

      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-lg font-semibold text-gray-800 dark:text-[var(--fg-primary)]">ようこそ kaiwaiへ</h1>
            <p className="text-sm text-gray-500 dark:text-[var(--fg-secondary)]">
              まずはプロフィール写真を設定しましょう(あとから変更できます)
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <img src={displayPhoto} alt="プロフィール画像" className="w-24 h-24 rounded-full object-cover" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 bg-black text-white rounded-full text-xs flex items-center justify-center hover:bg-gray-700"
              >
                ✎
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm text-gray-500 dark:text-[var(--fg-secondary)] hover:text-black dark:hover:text-[var(--fg-primary)] transition-colors"
            >
              写真を選ぶ
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--fg-primary)] mb-1">表示名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--border-subtle)] dark:bg-[var(--surface)] dark:text-[var(--fg-primary)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
              placeholder="あなたの名前"
            />
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {savingProfile ? "保存中..." : "保存して次へ"}
            </button>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full text-sm text-gray-400 dark:text-[var(--fg-muted)] py-1 hover:text-gray-600 dark:hover:text-[var(--fg-secondary)]"
            >
              あとで設定する
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-lg font-semibold text-gray-800 dark:text-[var(--fg-primary)]">気になるKAIWAIに参加しよう</h1>
            <p className="text-sm text-gray-500 dark:text-[var(--fg-secondary)]">
              ひとまず「ビギナーズ」KAIWAIに参加済みです。他にも気になるものがあれば追加で参加できます
            </p>
          </div>

          <div className="space-y-2">
            {suggestions.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-[var(--fg-muted)] text-center py-4">読み込み中...</p>
            ) : (
              suggestions.map((k) => {
                const joined = joinedIds.has(k.id);
                return (
                  <div
                    key={k.id}
                    className="flex items-center justify-between px-4 py-3 border border-gray-200 dark:border-[var(--border-subtle)] rounded-xl"
                  >
                    <span className="text-sm text-gray-800 dark:text-[var(--fg-primary)]">{k.name}</span>
                    <button
                      type="button"
                      onClick={() => handleJoinSuggestion(k)}
                      disabled={joined || joiningId === k.id}
                      className={`px-4 py-1.5 rounded-full text-xs border transition-colors ${
                        joined
                          ? "border-gray-200 dark:border-[var(--border-subtle)] text-gray-400 dark:text-[var(--fg-muted)]"
                          : "border-gray-300 dark:border-[var(--border-subtle)] text-gray-600 dark:text-[var(--fg-secondary)] hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)]"
                      }`}
                    >
                      {joined ? "✓ 参加済み" : joiningId === k.id ? "参加中..." : "参加する"}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            フィードへ進む
          </button>
        </div>
      )}
    </div>
  );
}
