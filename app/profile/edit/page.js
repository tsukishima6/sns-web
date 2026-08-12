"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import Link from "next/link";

const fallbackPhoto =
  "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/84549708.png?alt=media&token=642659d7-deb2-4d86-94a1-c43634e66d24";

function TagChip({ tag, selectedTags, onToggle }) {
  const selected = selectedTags.some((t) => t.id === tag.id);
  return (
    <button
      type="button"
      onClick={() => onToggle(tag)}
      className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-sm border transition-colors ${
        selected
          ? "bg-black text-white border-black dark:border-white"
          : "bg-white dark:bg-[var(--surface)] text-gray-700 dark:text-[var(--fg-secondary)] border-gray-300 dark:border-[var(--border-subtle)] hover:border-gray-400 dark:hover:border-[var(--fg-muted)]"
      }`}
    >
      #{tag.name}
    </button>
  );
}

export default function ProfileEditPage() {
  const { user, userDoc, loading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [profileID, setProfileID] = useState("");
  const [bio, setBio] = useState("");
  const [currentPhoto, setCurrentPhoto] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const [kaiwaiRef, setKaiwaiRef] = useState(null);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTagText, setNewTagText] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    loadProfile();
  }, [user, userDoc, loading]);

  async function loadProfile() {
    const profileRef = userDoc?.nowprofile || doc(db, "users", user.uid, "profile", user.uid);
    try {
      const snap = await getDoc(profileRef);
      let profileCategories = [];
      if (snap.exists()) {
        const data = snap.data();
        setName(data.name || "");
        setProfileID(data.ID || "");
        setBio(data.bio || "");
        setCurrentPhoto(data.photo || "");
        profileCategories = data.categories || [];
      }

      if (userDoc?.kaiwai) {
        setKaiwaiRef(userDoc.kaiwai);
        const catSnap = await getDocs(
          query(collection(db, "kaiwai", userDoc.kaiwai.id, "category"), orderBy("amount", "desc"))
        );
        const tags = catSnap.docs.map((d) => ({
          id: d.id,
          name: d.data().category_name || "",
          ref: d.ref,
          time: d.data().time?.toMillis?.() || 0,
        }));
        setAvailableTags(tags);
        setSelectedTags(tags.filter((t) => profileCategories.some((c) => c.path === t.ref.path)));
      }
    } catch (e) {
      console.error("profile load error:", e);
    }
  }

  async function toggleTag(tag) {
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    if (isSelected) {
      setSelectedTags((prev) => prev.filter((t) => t.id !== tag.id));
    } else {
      setSelectedTags((prev) => [...prev, tag]);
    }
    try {
      await updateDoc(tag.ref, { amount: increment(isSelected ? -1 : 1) });
    } catch (e) {
      console.error("tag amount update error:", e);
    }
  }

  async function handleAddNewTag(e) {
    e.preventDefault();
    const name = newTagText.trim().slice(0, 18);
    if (!name || !kaiwaiRef) return;
    try {
      const newRef = await addDoc(collection(db, "kaiwai", kaiwaiRef.id, "category"), {
        category_name: name,
        amount: 1,
        time: serverTimestamp(),
      });
      const newTag = { id: newRef.id, name, ref: newRef, time: Date.now() };
      setAvailableTags((prev) => [newTag, ...prev]);
      setSelectedTags((prev) => [...prev, newTag]);
      setNewTagText("");
    } catch (e) {
      console.error("tag create error:", e);
    }
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("表示名を入力してください");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const profileRef = userDoc?.nowprofile || doc(db, "users", user.uid, "profile", user.uid);

      let photoURL = currentPhoto;
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const storageRef = ref(storage, `users/${user.uid}/profile_${Date.now()}.${ext}`);
        await uploadBytes(storageRef, imageFile);
        photoURL = await getDownloadURL(storageRef);
      }

      await updateDoc(profileRef, {
        name: name.trim(),
        ID: profileID.trim(),
        bio: bio.trim(),
        photo: photoURL,
      });

      if (kaiwaiRef) {
        const categoryRefs = selectedTags.map((t) => t.ref);
        await updateDoc(profileRef, { categories: categoryRefs });
        await updateDoc(doc(db, "users", user.uid), { categories: categoryRefs });
      }

      router.push(`/users/${user.uid}/profile/${profileRef.id}`);
    } catch (e) {
      console.error("profile update error:", e);
      setError("更新に失敗しました。もう一度お試しください。");
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

  const displayPhoto = imagePreview || currentPhoto || fallbackPhoto;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-base font-semibold text-gray-800 dark:text-[var(--fg-primary)]">プロフィール編集</h1>
        <Link href={`/users/${user.uid}/profile/${user.uid}`} className="text-sm text-gray-400 dark:text-[var(--fg-muted)] hover:text-gray-600 dark:hover:text-[var(--fg-secondary)]">
          キャンセル
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* アイコン画像 */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <img
              src={displayPhoto}
              alt="プロフィール画像"
              className="w-24 h-24 rounded-full object-cover"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-black text-white rounded-full text-xs flex items-center justify-center hover:bg-gray-700"
            >
              ✎
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-sm text-gray-500 dark:text-[var(--fg-secondary)] hover:text-black dark:hover:text-[var(--fg-primary)] transition-colors"
          >
            写真を変更
          </button>
        </div>

        {/* 表示名 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-[var(--fg-primary)] mb-1">
            表示名
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--border-subtle)] dark:bg-[var(--surface)] dark:text-[var(--fg-primary)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="あなたの名前"
          />
        </div>

        {/* ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-[var(--fg-primary)] mb-1">
            ID
          </label>
          <input
            type="text"
            value={profileID}
            onChange={(e) => setProfileID(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--border-subtle)] dark:bg-[var(--surface)] dark:text-[var(--fg-primary)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="your_id"
          />
          <p className="text-xs text-gray-400 dark:text-[var(--fg-muted)] mt-1">@の後に表示される識別子です</p>
        </div>

        {/* 自己紹介 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-[var(--fg-primary)] mb-1">
            自己紹介
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-[var(--border-subtle)] dark:bg-[var(--surface)] dark:text-[var(--fg-primary)] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="自己紹介を入力してください"
          />
          <p className="text-right text-xs text-gray-400 dark:text-[var(--fg-muted)] mt-1">{bio.length} 文字</p>
        </div>

        {/* タグ */}
        {kaiwaiRef && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--fg-primary)] mb-1.5">タグ</label>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-base shrink-0" title="人気順">🔥</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {availableTags.map((tag) => (
                  <TagChip key={tag.id} tag={tag} selectedTags={selectedTags} onToggle={toggleTag} />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-base shrink-0" title="新着順">🆕</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[...availableTags]
                  .sort((a, b) => b.time - a.time)
                  .map((tag) => (
                    <TagChip key={tag.id} tag={tag} selectedTags={selectedTags} onToggle={toggleTag} />
                  ))}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={newTagText}
                onChange={(e) => setNewTagText(e.target.value.slice(0, 18))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddNewTag(e);
                }}
                placeholder="新しいタグを作成"
                className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-[var(--border-subtle)] dark:bg-[var(--surface)] dark:text-[var(--fg-primary)] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                type="button"
                onClick={handleAddNewTag}
                className="px-3 py-1.5 rounded-full text-sm border border-gray-300 dark:border-[var(--border-subtle)] text-gray-600 dark:text-[var(--fg-secondary)] hover:bg-gray-50 dark:hover:bg-[var(--surface-muted)]"
              >
                追加
              </button>
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {submitting ? "保存中..." : "保存する"}
        </button>
      </form>
    </div>
  );
}
