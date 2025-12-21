import type { Metadata } from "next";
import "./globals.css";
import { GoogleTagManager } from "@next/third-parties/google";

export const metadata: Metadata = {
  title: "Salendar - 할인 & 이벤트 모음",
  description:
    "브랜드의 다양한 할인 행사와 사은품 증정 이벤트를 월별 캘린더와 카테고리로 정리하여 보여주는 웹 애플리케이션입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>

      <GoogleTagManager gtmId="GTM-P2VPM9PH" />

      <body className="bg-[#F1F2F6] font-sans antialiased">
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-P2VPM9PH"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {children}
      </body>
    </html>
  );
}
