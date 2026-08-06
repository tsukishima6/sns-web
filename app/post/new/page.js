"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import Link from "next/link";

export default function NewPostPage() {
  const { user, userDoc, loading } = useAuth();
  const router = useRouter();

  const [text, setText] = useState("");
  const [images, setImages] = useState([]); // File[]
  const [previews, setPreviews] = useState([]); // objectURL[]
  const [kaiwaiOptions, setKaiwaiOptions] = useState([]); // [{id, name, ref}]
  const [selectedKaiwai, setSelectedKaiwai] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  // kaiwaiリストの名前を取得
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
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
      if (valid.length > 0) setSelectedKaiwai(valid[0].id);
    });
  }, [user, userDoc, loading]);

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
      for (const file of images) {
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
        <p className="text-gray-400 text-sm">読み込み中...</p>
      </div>
    );
  }

  if (!user) return null;

  const hasKaiwai = kaiwaiOptions.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-base font-semibold text-gray-800">新規投稿</h1>
        <Link href="/feed" className="text-sm text-gray-400 hover:text-gray-600">
          キャンセル
        </Link>
      </div>

      {!hasKaiwai ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm mb-2">参加している界隈がありません</p>
          <p className="text-gray-400 text-xs">アプリから界隈に参加してから投稿できます</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 界隈セレクタ */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              界隈を選択
            </label>
            <select
              value={selectedKaiwai}
              onChange={(e) => setSelectedKaiwai(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
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
              className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black"
            />
            <p className="text-right text-xs text-gray-400 mt-1">{text.length} 文字</p>
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
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors"
              >
                <span className="text-lg leading-none">🖼</span>
                画像を追加（最大3枚）
              </button>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-xl">
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
