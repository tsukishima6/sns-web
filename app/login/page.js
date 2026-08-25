"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import {
  AuthScreen,
  SocialButton,
  Divider,
  FloatingInput,
  PillSubmitButton,
  GoogleIcon,
  MailIcon,
  EyeIcon,
} from "../components/AuthUI";

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/feed");
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push("/feed");
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Googleログインに失敗しました");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreen
      title="sign in"
      switchPrompt="アカウントをお持ちでない方は"
      switchLabel="sign up"
      switchHref="/signup"
    >
      <SocialButton onClick={handleGoogleLogin} disabled={loading} icon={<GoogleIcon />} label="Googleでログイン" />

      <Divider />

      <form onSubmit={handleSubmit}>
        <FloatingInput
          id="email"
          type="email"
          label="メールアドレス"
          value={email}
          onChange={setEmail}
          autoComplete="username"
        />
        <FloatingInput
          id="password"
          type={showPassword ? "text" : "password"}
          label="パスワード"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          suffix={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
              style={{ color: "var(--fg-muted)" }}
              className="flex items-center"
            >
              <EyeIcon off={!showPassword} />
            </button>
          }
        />

        <div className="flex justify-end mt-1 mb-2">
          <Link
            href="/settings/password"
            className="text-xs hover:underline"
            style={{ color: "var(--fg-secondary)", fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif" }}
          >
            パスワードをお忘れの場合
          </Link>
        </div>

        {error && (
          <p
            className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 dark:text-red-400 px-4 py-2.5 rounded-2xl mb-3"
            style={{ fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif" }}
          >
            {error}
          </p>
        )}

        <div className="flex justify-end mt-2">
          <PillSubmitButton
            active={email !== "" && password !== ""}
            loading={loading}
            icon={<MailIcon />}
            label="sign in"
          />
        </div>
      </form>
    </AuthScreen>
  );
}

function getErrorMessage(code) {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "メールアドレスまたはパスワードが正しくありません";
    case "auth/too-many-requests":
      return "試行回数が多すぎます。しばらくしてからお試しください";
    default:
      return "ログインに失敗しました";
  }
}
