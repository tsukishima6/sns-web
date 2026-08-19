"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function SignupPage() {
  const { signup, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("パスワードは6文字以上で設定してください");
      return;
    }
    setLoading(true);
    try {
      await signup(email, password, displayName);
      router.push("/onboarding");
    } catch (err) {
      setError(getErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push("/onboarding");
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
      title="sign up"
      switchPrompt="すでにアカウントをお持ちの方は"
      switchLabel="sign in"
      switchHref="/login"
    >
      <SocialButton onClick={handleGoogleSignup} disabled={loading} icon={<GoogleIcon />} label="Googleで登録" />

      <Divider />

      <form onSubmit={handleSubmit}>
        <FloatingInput
          id="displayName"
          type="text"
          label="表示名"
          value={displayName}
          onChange={setDisplayName}
          autoComplete="nickname"
        />
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
          label="パスワード（6文字以上）"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
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

        {error && (
          <p
            className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 dark:text-red-400 px-4 py-2.5 rounded-2xl mb-3 mt-1"
            style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
          >
            {error}
          </p>
        )}

        <p
          className="text-xs text-center mb-4 mt-2"
          style={{ color: "var(--fg-muted)", fontFamily: "'Noto Sans JP', sans-serif" }}
        >
          アカウントを作成すると利用規約に同意いただいたものとします
        </p>

        <div className="flex justify-center">
          <PillSubmitButton
            active={displayName !== "" && email !== "" && password !== ""}
            loading={loading}
            icon={<MailIcon />}
            label="sign up"
          />
        </div>
      </form>
    </AuthScreen>
  );
}

function getErrorMessage(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "このメールアドレスはすでに使用されています";
    case "auth/invalid-email":
      return "メールアドレスの形式が正しくありません";
    case "auth/weak-password":
      return "パスワードが脆弱です。6文字以上で設定してください";
    default:
      return "登録に失敗しました";
  }
}
