import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Island Waves — Caribbean Radio Hub",
  description:
    "One place to discover and play Caribbean internet radio — reggae, soca, dancehall, zouk, kompa, chutney, and island talk.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
