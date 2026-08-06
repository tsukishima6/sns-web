"use client";

import { AuthProvider } from "@/lib/AuthContext";
import Header from "./components/Header";
import FooterNav from "./components/FooterNav";

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <Header />
      {children}
      <FooterNav />
    </AuthProvider>
  );
}
