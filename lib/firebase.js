// lib/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyAXv2wLKTcgq7-fTw0Y3-R9F4fX4OvS96s",
  authDomain: "tsukishima6-3d139.firebaseapp.com",
  projectId: "tsukishima6-3d139",
  storageBucket: "tsukishima6-3d139.appspot.com",
  messagingSenderId: "190712155553",
  appId: "1:190712155553:web:71aac5615bfafce1ce4fe0"
  // measurementId は今回は不要
};

// Firebase 初期化
const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);

// ←✨これを追加！
export default app;
