import type { Metadata } from "next";
import "./style.css";
export const metadata: Metadata = {
  title: "ノクトとルクスのクリスマス2026",
  description:
    "ノクトとルクスのお部屋で、クリスマスまで毎日ひとつ贈りものを開けよう。",
  icons: { icon: "/images/christmas/star.svg" },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
