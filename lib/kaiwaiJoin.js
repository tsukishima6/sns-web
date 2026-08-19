import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// この界隈に対して既に持っているprofileドキュメントを探す(参加済みかどうかの判定用)
export async function findExistingProfile(uid, kaiwaiRef) {
  const q = query(collection(db, "users", uid, "profile"), where("kaiwai", "==", kaiwaiRef));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ref: d.ref, ...d.data() };
}

// 既に参加済みのkaiwaiをメインに切り替えるだけ
// (ネイティブ ffcode/lib/subkaiwai/kaiwai_items/kaiwai_items_widget.dart 138-163行、
//  kaiwaiListに既に含まれる場合は新規参加処理を丸ごとスキップしこの切替のみ行う)
export async function switchMainKaiwai(uid, kaiwaiRef, profileRef) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { kaiwai: kaiwaiRef, nowprofile: profileRef });
}

// 新規参加
// (ネイティブ ffcode/lib/subkaiwai/kaiwai_items/kaiwai_items_widget.dart 164-258行と
//  同じ書き込み順序: users更新 → profile作成 → kaiwai.users arrayUnion(単独更新、
//  Firestoreルールが要求) → users.nowprofile更新 → 参加投稿作成)
export async function joinKaiwai({ uid, userDoc, kaiwaiRef, kaiwaiName }) {
  const userRef = doc(db, "users", uid);

  // 1. メインkaiwaiを即座に切り替え + kaiwai_listへ追加
  await updateDoc(userRef, {
    kaiwai: kaiwaiRef,
    kaiwai_list: arrayUnion(kaiwaiRef),
  });

  // 2. この界隈専用の新規プロフィールを作成(既存プロフィールのID/表示名/写真を引き継ぐ)
  const currentProfileRef = userDoc?.nowprofile || doc(db, "users", uid, "profile", uid);
  const currentProfileSnap = await getDoc(currentProfileRef);
  const currentProfileID = currentProfileSnap.exists() ? currentProfileSnap.data().ID || "" : "";

  const profileRef = doc(collection(db, "users", uid, "profile"));
  await setDoc(profileRef, {
    name: userDoc?.display_name || "",
    ID: currentProfileID,
    photo: userDoc?.photo_url || "",
    bio: "",
    kaiwai: kaiwaiRef,
    created_time: serverTimestamp(),
  });

  // 3. kaiwai.usersへの単独arrayUnion
  // (isKaiwaiMembershipToggle()は変更キーが"users"のみであることを要求するため、
  //  他フィールドと一緒に更新してはいけない)
  await updateDoc(kaiwaiRef, { users: arrayUnion(userRef) });

  // 4. nowprofileを新しいprofileへ切り替え
  await updateDoc(userRef, { nowprofile: profileRef });

  // 5. 参加投稿
  // (botのwelcomeReaction.jsが"に参加しました"の部分一致で検知し、即座にいいね・歓迎コメントする)
  await addDoc(collection(db, "users", uid, "posts"), {
    postDescription: `${kaiwaiName}KAIWAIに参加しました！よろしくお願いします。`,
    postPhoto: "",
    postphoto2: "",
    postphoto3: "",
    postUser: userRef,
    postUser_profile: profileRef,
    kaiwai: kaiwaiRef,
    timePosted: serverTimestamp(),
    numlikes: 0,
    amount_comment: 0,
    postOwner: true,
    users_liked: [],
    users_favorited: [],
    hashtags: [],
  });

  return profileRef;
}
