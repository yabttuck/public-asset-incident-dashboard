import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "공공 시설물·전산 자산 장애 관리",
  description: "공공 시설물과 전산 자산의 장애 접수 및 처리 현황을 관리합니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
