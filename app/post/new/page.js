"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  collection,
  addDoc,
  getDoc,
  serverTimestamp,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { useSignupPrompt } from "@/lib/SignupPromptContext";
import { compressImageFile } from "@/lib/compressImage";
import Link from "next/link";

export default function NewPostPage() {
  return (
    <Suspense fallback={null}>
      <NewPostForm />
    </Suspense>
  );
}

function NewPostForm() {
  const { user, userDoc, loading } = useAuth();
  const { openSignupPrompt } = useSignupPrompt();
  const router = useRouter();
  const searchParams = useSearchParams();
  // ニュース詳細ページの「引用して投稿」から遷移してきた場合、
  // ?quoteNews=kaiwai/{kaiwaiID}/news/{newsID} というパス文字列が付与される。
  // DocumentReferenceではなくURLに乗せられる文字列で受け渡す(他コンポーネントの
  // path文字列規約と同じ理由)。
  const quoteNewsPath = searchParams.get("quoteNews");
  // 店舗詳細ページの「この店舗を引用して投稿」(誰でも可)/「{店舗名}として投稿」
  // (オーナー・メンバー限定、権限チェックは店舗詳細ページ側で行う)から遷移してきた場合、
  // それぞれ ?quoteBiz=business/{id} / ?asBiz=business/{id} が付与される。
  // ネイティブ(postcreate_widget.dart)と同じく、この2つは同時には使わない
  const quoteBizPath = searchParams.get("quoteBiz");
  const asBizPath = searchParams.get("asBiz");

  const [text, setText] = useState("");
  const [images, setImages] = useState([]); // File[]
  const [previews, setPreviews] = useState([]); // objectURL[]
  const [kaiwaiOptions, setKaiwaiOptions] = useState([]); // [{id, name, ref}]
  const [selectedKaiwai, setSelectedKaiwai] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [quoteNewsPreview, setQuoteNewsPreview] = useState(null);
  const [bizPreview, setBizPreview] = useState(null);
  const fileRef = useRef(null);
  const bizPath = quoteBizPath || asBizPath;

  // kaiwaiリストの名前を取得
  useEffect(() => {
    if (loading) return;
    if (!user) {
      openSignupPrompt();
      router.push("/");
      return;
    }
    const list = userDoc?.kaiwai_list || [];
    if (list.length === 0) return;

    Promise.all(
      list.map(async (kaiwaiRef) => {
        try {
          const snap = await getDoc(kaiwaiRef);
          if (snap.exists()) {
            return { id: snap.id, name: snap.data().name || snap.id, ref: kaiwaiRef };
          }
        } catch {}
        return null;
      })
    ).then((results) => {
      const valid = results.filter(Boolean);
      setKaiwaiOptions(valid);
      // ニュース/店舗引用の場合、その引用元が属するkaiwaiを初期選択にする
      // (ニュースのパスは"kaiwai/{kaiwaiID}/news/{newsID}"なので2番目のセグメントがkaiwaiID。
      // 店舗はbusinessPreview.kaiwaiIdとして別途非同期取得する)
      const quoteNewsKaiwaiID = quoteNewsPath?.split("/")[1];
      const preferredKaiwaiID = quoteNewsKaiwaiID || bizPreview?.kaiwaiId;
      const matched = valid.find((k) => k.id === preferredKaiwaiID);
      if (matched) {
        setSelectedKaiwai(matched.id);
      } else if (valid.length > 0) {
        setSelectedKaiwai((prev) => prev || valid[0].id);
      }
    });
  }, [user, userDoc, loading, quoteNewsPath, bizPreview]);

  // 引用元ニュースのプレビュー取得
  useEffect(() => {
    if (!quoteNewsPath) {
      setQuoteNewsPreview(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, quoteNewsPath));
        if (!cancelled && snap.exists()) {
          const data = snap.data();
          setQuoteNewsPreview({ title: data.title || "", img: data.img || "", sitename: data.sitename || "" });
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [quoteNewsPath]);

  // 引用元/投稿主となる店舗のプレビュー取得
  useEffect(() => {
    if (!bizPath) {
      setBizPreview(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, bizPath));
        if (!cancelled && snap.exists()) {
          const data = snap.data();
          setBizPreview({
            name: data.display_name || "",
            subname: data.subname || "",
            photo: data.photo_1 || "",
            kaiwaiId: data.kaiwai?.id || null,
          });
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [bizPath]);

  // 画像選択
  function handleImageChange(e) {
    const files = Array.from(e.target.files).slice(0, 3);
    setImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  }

  function removeImage(idx) {
    const newImages = images.filter((_, i) => i !== idx);
    const newPreviews = previews.filter((_, i) => i !== idx);
    setImages(newImages);
    setPreviews(newPreviews);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() && images.length === 0) {
      setError("テキストまたは画像を入力してください");
      return;
    }
    if (!selectedKaiwai) {
      setError("界隈を選択してください");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const kaiwaiObj = kaiwaiOptions.find((k) => k.id === selectedKaiwai);
      const kaiwaiRef = kaiwaiObj?.ref;

      // nowprofileを取得（なければuid-based profileを使う）
      const profileRef =
        userDoc?.nowprofile ||
        doc(db, "users", user.uid, "profile", user.uid);

      // 画像をStorageにアップロード
      const photoURLs = [];
      for (const rawFile of images) {
        const file = await compressImageFile(rawFile);
        const ext = file.name.split(".").pop();
        const storageRef = ref(
          storage,
          `users/${user.uid}/posts/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
        );
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        photoURLs.push(url);
      }

      const postData = {
        postDescription: text.trim(),
        postPhoto: photoURLs[0] || "",
        postphoto2: photoURLs[1] || "",
        postphoto3: photoURLs[2] || "",
        postUser: doc(db, "users", user.uid),
        postUser_profile: profileRef,
        kaiwai: kaiwaiRef || null,
        timePosted: serverTimestamp(),
        numlikes: 0,
        amount_comment: 0,
        postOwner: true,
        users_liked: [],
        users_favorited: [],
        hashtags: [],
        ...(quoteNewsPath ? { quote_news: doc(db, quoteNewsPath) } : {}),
        ...(quoteBizPath ? { quote_biz: doc(db, quoteBizPath) } : {}),
        ...(asBizPath ? { asbiz: doc(db, asBizPath) } : {}),
      };

      await addDoc(collection(db, "users", user.uid, "posts"), postData);
      router.push("/feed");
    } catch (err) {
      console.error("post error:", err);
      setError("投稿に失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 dark:text-[var(--fg-muted)] text-sm">読み込み中...</p>
      </div>
    );
  }

  if (!user) return null;

  const hasKaiwai = kaiwaiOptions.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-base font-semibold text-gray-800 dark:text-[var(--fg-primary)]">新規投稿</h1>
        <Link href="/feed" className="text-sm text-gray-400 dark:text-[var(--fg-muted)] hover:text-gray-600 dark:hover:text-[var(--fg-secondary)]">
          キャンセル
        </Link>
      </div>

      {!hasKaiwai ? (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-[var(--fg-secondary)] text-sm mb-2">参加している界隈がありません</p>
          <p className="text-gray-400 dark:text-[var(--fg-muted)] text-xs">アプリから界隈に参加してから投稿できます</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ニュース引用プレビュー */}
          {quoteNewsPath && quoteNewsPreview && (
            <div className="flex items-center gap-3 border border-gray-200 dark:border-[var(--border-subtle)] rounded-xl px-3 py-2.5">
              {quoteNewsPreview.img && (
                <img
                  src={quoteNewsPreview.img}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="text-xs text-gray-400 dark:text-[var(--fg-muted)] mb-0.5">このニュースを引用</p>
                <p className="text-sm text-gray-700 dark:text-[var(--fg-secondary)] truncate">
                  {quoteNewsPreview.title}
                </p>
              </div>
            </div>
          )}

          {/* 店舗の引用/店舗として投稿するプレビュー */}
          {bizPath && bizPreview && (
            <div className="flex items-center gap-3 border border-gray-200 dark:border-[var(--border-subtle)] rounded-xl px-3 py-2.5">
              {bizPreview.photo && (
                <img
                  src={bizPreview.photo}
                  alt=""
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="text-xs text-gray-400 dark:text-[var(--fg-muted)] mb-0.5">
                  {asBizPath ? "この店舗として投稿" : "この店舗を引用"}
                </p>
                <p className="text-sm text-gray-700 dark:text-[var(--fg-secondary)] truncate">
                  {bizPreview.name}
                </p>
              </div>
            </div>
          )}

          {/* 界隈セレクタ */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-[var(--fg-secondary)] mb-1.5">
              界隈を選択
            </label>
            <select
              value={selectedKaiwai}
              onChange={(e) => setSelectedKaiwai(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-[var(--border-subtle)] rounded-xl text-sm bg-white dark:bg-[var(--surface)] dark:text-[var(--fg-primary)] focus:outline-none focus:ring-2 focus:ring-black"
            >
              {kaiwaiOptions.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
          </div>

          {/* テキスト入力 */}
          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="いまどうしてる？"
              rows={5}
              className="w-full px-3 py-3 border border-gray-200 dark:border-[var(--border-subtle)] dark:bg-[var(--surface)] dark:text-[var(--fg-primary)] rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black"
            />
            <p className="text-right text-xs text-gray-400 dark:text-[var(--fg-muted)] mt-1">{text.length} 文字</p>
          </div>

          {/* 画像プレビュー */}
          {previews.length > 0 && (
            <div className="flex gap-2">
              {previews.map((src, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={src}
                    alt=""
                    className="w-24 h-24 object-cover rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full text-xs flex items-center justify-center hover:bg-black"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 画像追加ボタン */}
          {images.length < 3 && (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-[var(--fg-secondary)] hover:text-black dark:hover:text-[var(--fg-primary)] transition-colors"
              >
                <span className="text-lg leading-none">🖼</span>
                画像を追加（最大3枚）
              </button>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-black text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {submitting ? "投稿中..." : "投稿する"}
          </button>
        </form>
      )}
    </div>
  );
}
