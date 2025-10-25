import { Urbanist, Montserrat, Shippori_Mincho, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script"; // ← GA用に追加

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const shipporiMincho = Shippori_Mincho({
  variable: "--font-shippori-mincho",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["400" , "500", "600" , "700"],
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600" , "700"],
});

export const metadata = {
  title: "kaiwai｜界隈の数だけ、SNSがあっていい",
  description: "趣味・地域・職種・・各界隈の情報にドップリ浸かる、新しい国産SNS『kaiwai』のWeb版です。",
openGraph: {
    title: "kaiwai｜界隈の数だけ、SNSがあっていい",
    description:
      "趣味・地域・職種・・各界隈の情報にドップリ浸かる、新しい国産SNS『kaiwai』のWeb版です。",
    url: "https://robust-lab.com", // ← あなたの本番URLに変更
    siteName: "kaiwai",
    images: [
      {
        url: "https://firebasestorage.googleapis.com/v0/b/tsukishima6-3d139.appspot.com/o/kw.jpg?alt=media&token=dc565a57-5fab-49bf-8cee-af18dc0d77ef", // OGP画像URL
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}

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
