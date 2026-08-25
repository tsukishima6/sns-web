import {
  Urbanist,
  Shippori_Mincho,
  Zen_Antique,
  Klee_One,
  Noto_Sans_JP, // ← 追加！
} from "next/font/google";
import "./globals.css";
import Script from "next/script";
import FloatingAppPromo from "./components/FloatingAppPromo";
import SignupPromptDialog from "./components/SignupPromptDialog";
import Providers from "./providers";
import { ThemeProvider } from "@/lib/ThemeContext";
import { AppPromoProvider } from "@/lib/AppPromoContext";
import { SignupPromptProvider } from "@/lib/SignupPromptContext";

// 各フォントの設定
const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-urbanist",
});

const shipporiMincho = Shippori_Mincho({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-shippori-mincho",
});

const zenAntique = Zen_Antique({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-zen-antique",
});

const kleeOne = Klee_One({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-klee-one",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
});

export const metadata = {
  metadataBase: new URL("https://kaiwai.vercel.app"),
  title: "kaiwai｜界隈の数だけ、SNSがあっていい",
  description:
    "趣味・地域・職種・・各界隈の情報にドップリ浸かる、新しい国産SNS『kaiwai』のWeb版です。",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "kaiwai｜界隈の数だけ、SNSがあっていい",
    description:
      "趣味・地域・職種・・各界隈の情報にドップリ浸かる、新しい国産SNS『kaiwai』のWeb版です。",
    url: "https://kaiwai.vercel.app",
    siteName: "kaiwai",
    images: [
      {
        url:
          "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kw.jpg?alt=media&token=dc565a57-5fab-49bf-8cee-af18dc0d77ef",
        width: 1200,
        height: 630,
        alt: "KAIWAI OGP",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body
        className={`
          ${urbanist.variable}
          ${shipporiMincho.variable}
          ${zenAntique.variable}
          ${kleeOne.variable}
          ${notoSansJP.variable}   /* ← 追加！ */
          antialiased
        `}
      >
        {/* 初回ペイント前にダークモードを適用し、切り替え時のチラつき（FOUC）を防ぐ */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('kaiwai-theme');
                var isDark = t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) document.documentElement.classList.add('dark');
              } catch (e) {}
            `,
          }}
        />
        <ThemeProvider>
          <AppPromoProvider>
            <SignupPromptProvider>
              <Providers>
                <main className="pb-16">
                  {children}
                </main>
                <FloatingAppPromo />
                <SignupPromptDialog />
              </Providers>
            </SignupPromptProvider>
          </AppPromoProvider>
        </ThemeProvider>

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-3KDYD7ZX5X"
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-3KDYD7ZX5X');
          `}
        </Script>
      </body>
    </html>
  );
}
