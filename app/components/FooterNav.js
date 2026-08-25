"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useSignupPrompt } from "@/lib/SignupPromptContext";

// ---- icons ----

function FeedIcon({ active }) {
  return active ? (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 5h18v2H3V5zm0 4h18v2H3V9zm0 4h12v2H3v-2zm0 4h8v2H3v-2z" />
    </svg>
  ) : (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="3" y1="14" x2="15" y2="14" />
      <line x1="3" y1="18" x2="11" y2="18" />
    </svg>
  );
}

function ChatIcon({ active }) {
  return active ? (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
    </svg>
  ) : (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
    </svg>
  );
}

function SearchIcon({ active }) {
  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="22" y2="22" />
    </svg>
  );
}

function BellIcon({ active }) {
  return active ? (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4a1.5 1.5 0 0 0-3 0v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  ) : (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function PersonIcon({ active }) {
  return active ? (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12c2.7 0 5-2.3 5-5S14.7 2 12 2 7 4.3 7 7s2.3 5 5 5zm0 2c-3.3 0-10 1.7-10 5v2h20v-2c0-3.3-6.7-5-10-5z" />
    </svg>
  ) : (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

// ---- component ----

export default function FooterNav() {
  const pathname = usePathname();
  const { user, userDoc } = useAuth();
  const { openSignupPrompt } = useSignupPrompt();

  // ネイティブ発のアカウントはprofileが常にランダムID(uid=profileIDでは
  // ない)なので、users.nowprofileから実在するプロフィールへのパスを組み立てる。
  // userDoc読み込み中はuid=profileIDにフォールバック(web発アカウントの
  // デフォルトprofileはこの形なので多くの場合はそのまま機能する)
  const profileHref = user
    ? userDoc?.nowprofile
      ? `/users/${userDoc.nowprofile.parent.parent.id}/profile/${userDoc.nowprofile.id}`
      : `/users/${user.uid}/profile/${user.uid}`
    : null;

  const homeHref = user ? "/feed" : "/";

  const tabs = [
    {
      label: "ホーム",
      href: homeHref,
      icon: (a) => <FeedIcon active={a} />,
      active: pathname === homeHref,
      requiresAuth: false,
    },
    {
      label: "チャット",
      href: "/chat",
      icon: (a) => <ChatIcon active={a} />,
      active: !!user && (pathname === "/chat" || pathname?.startsWith("/chat/")),
      requiresAuth: true,
    },
    {
      label: "探す",
      href: "/explore",
      icon: (a) => <SearchIcon active={a} />,
      active: pathname === "/explore" || pathname?.startsWith("/explore/"),
      requiresAuth: false,
    },
    {
      label: "お知らせ",
      href: "/notice",
      icon: (a) => <BellIcon active={a} />,
      active: !!user && (pathname === "/notice" || pathname?.startsWith("/notice/")),
      requiresAuth: true,
    },
    {
      label: "マイページ",
      href: profileHref || "/feed",
      icon: (a) => <PersonIcon active={a} />,
      active: !!user && !!profileHref && (pathname === profileHref || pathname?.startsWith(profileHref + "/")),
      requiresAuth: true,
    },
  ];

  const activeColor = "#8fa8a7";
  const inactiveColor = "var(--fg-muted)";

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "60px",
        backgroundColor: "var(--card-bg)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        isolation: "isolate",
        transform: "translateZ(0)",
        borderTop: "1px solid var(--card-border)",
        display: "flex",
        alignItems: "stretch",
        zIndex: 9998,
        boxShadow: "0 -1px 8px rgba(0,0,0,0.06)",
      }}
    >
      {tabs.map((tab) => {
        const color = tab.active ? activeColor : inactiveColor;
        const locked = tab.requiresAuth && !user;

        const itemStyle = {
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textDecoration: "none",
          color,
          transition: "color 0.15s",
        };

        // 未ログインで保護タブを押した場合は/loginへ遷移させず、その場で
        // サインアップダイアログ(グラスモーフィズム)を開く
        if (locked) {
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => openSignupPrompt()}
              aria-label={tab.label}
              style={{
                ...itemStyle,
                background: "none",
                border: "none",
                cursor: "pointer",
                appearance: "none",
                WebkitAppearance: "none",
              }}
            >
              {tab.icon(tab.active)}
            </button>
          );
        }

        return (
          <Link key={tab.label} href={tab.href} aria-label={tab.label} style={itemStyle}>
            {tab.icon(tab.active)}
          </Link>
        );
      })}
    </nav>
  );
}
