"use client";

import Link from "next/link";

/* ─── ネイティブ版に寄せた共通レイアウト ───
   背景に sign_back.jpg（ffcode/assets/images/sign_back.jpg 由来）を敷き、
   下部にグラスモーフィズムのフォームパネルを重ねる構成 */
export function AuthScreen({ title, switchPrompt, switchLabel, switchHref, children }) {
  return (
    <div
      className="min-h-screen flex flex-col justify-end"
      style={{
        backgroundImage: "url(/sign-back.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        style={{
          background: "linear-gradient(to bottom, transparent 0%, var(--bg-page) 62%)",
        }}
      >
        <div className="max-w-sm mx-auto px-6 pt-16 pb-10">
          <h1
            className="text-center mb-6"
            style={{
              fontFamily: "'Urbanist', sans-serif",
              fontWeight: 500,
              fontSize: "1.9rem",
              color: "var(--fg-primary)",
            }}
          >
            {title}
          </h1>

          {children}

          <p
            className="text-sm text-center mt-6"
            style={{ color: "var(--fg-secondary)", fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif" }}
          >
            {switchPrompt}{" "}
            <Link
              href={switchHref}
              className="font-semibold"
              style={{ color: "#8fa8a7", fontFamily: "'Urbanist', sans-serif", fontSize: "1.05rem" }}
            >
              {switchLabel}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function SocialButton({ onClick, disabled, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 h-12 rounded-full disabled:opacity-50 transition-colors mb-4"
      style={{
        background: "var(--card-bg)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        isolation: "isolate",
        transform: "translateZ(0)",
        border: "none",
        color: "var(--fg-primary)",
        fontFamily: "'Urbanist', sans-serif",
        fontWeight: 700,
        fontSize: "0.95rem",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

export function Divider() {
  return (
    <div className="relative flex items-center justify-center my-4">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t" style={{ borderColor: "var(--card-border)" }} />
      </div>
      <span
        className="relative px-3 text-xs"
        style={{ color: "var(--fg-muted)", fontFamily: "'Urbanist', sans-serif" }}
      >
        or
      </span>
    </div>
  );
}

export function FloatingInput({ id, type, label, value, onChange, autoComplete, suffix }) {
  return (
    <div
      className="relative mb-3 flex items-center rounded-full"
      style={{
        background: "var(--card-bg)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        isolation: "isolate",
        transform: "translateZ(0)",
        border: "none",
      }}
    >
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete={autoComplete}
        placeholder=" "
        className="peer w-full h-14 pl-5 pr-4 pt-4 bg-transparent rounded-full text-sm focus:outline-none placeholder-transparent"
        style={{ color: "var(--fg-primary)", fontFamily: "'Urbanist', sans-serif" }}
      />
      <label
        htmlFor={id}
        className="absolute left-5 top-1/2 -translate-y-1/2 text-sm pointer-events-none transition-all duration-150 peer-focus:top-4 peer-focus:text-[0.68rem] peer-[:not(:placeholder-shown)]:top-4 peer-[:not(:placeholder-shown)]:text-[0.68rem]"
        style={{ color: "var(--fg-muted)", fontFamily: "'Urbanist', 'Noto Sans JP', sans-serif" }}
      >
        {label}
      </label>
      {suffix && <div className="pr-5">{suffix}</div>}
    </div>
  );
}

export function PillSubmitButton({ active, loading, icon, label }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex items-center gap-2 h-11 px-6 rounded-full transition-opacity disabled:cursor-not-allowed"
      style={{
        opacity: loading ? 0.5 : active ? 1 : 0.6,
        border: "1.3px solid var(--fg-primary)",
        color: "var(--fg-primary)",
        fontFamily: "'Urbanist', sans-serif",
        fontWeight: 600,
        fontSize: "1rem",
      }}
    >
      {icon}
      {loading ? "…" : label}
    </button>
  );
}

export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export function MailIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export function EyeIcon({ off }) {
  return off ? (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  ) : (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
