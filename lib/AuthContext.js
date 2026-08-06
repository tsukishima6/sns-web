"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        setUserDoc(snap.exists() ? snap.data() : null);
      } else {
        setUserDoc(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function signup(email, password, displayName) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = credential.user;

    await updateProfile(firebaseUser, { displayName });

    const userRef = doc(db, "users", firebaseUser.uid);
    const profileRef = doc(db, "users", firebaseUser.uid, "profile", firebaseUser.uid);

    await setDoc(profileRef, {
      name: displayName,
      ID: firebaseUser.uid.slice(0, 8),
      photo: "",
      bio: "",
      created_time: serverTimestamp(),
    });

    const userData = {
      display_name: displayName,
      email,
      uid: firebaseUser.uid,
      photo_url: "",
      created_time: serverTimestamp(),
      kaiwai_list: [],
      blocklist: [],
      blockedlist: [],
      nowprofile: profileRef,
    };
    await setDoc(userRef, userData);
    setUserDoc(userData);

    return credential;
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    const firebaseUser = credential.user;

    const userRef = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      const profileRef = doc(db, "users", firebaseUser.uid, "profile", firebaseUser.uid);

      await setDoc(profileRef, {
        name: firebaseUser.displayName || "",
        ID: firebaseUser.uid.slice(0, 8),
        photo: firebaseUser.photoURL || "",
        bio: "",
        created_time: serverTimestamp(),
      });

      const userData = {
        display_name: firebaseUser.displayName || "",
        email: firebaseUser.email || "",
        uid: firebaseUser.uid,
        photo_url: firebaseUser.photoURL || "",
        created_time: serverTimestamp(),
        kaiwai_list: [],
        blocklist: [],
        blockedlist: [],
        nowprofile: profileRef,
      };
      await setDoc(userRef, userData);
      setUserDoc(userData);
    } else {
      setUserDoc(snap.data());
    }

    return credential;
  }

  async function logout() {
    await signOut(auth);
    setUserDoc(null);
  }

  return (
    <AuthContext.Provider value={{ user, userDoc, loading, login, signup, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
