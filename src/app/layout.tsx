import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { PlayerProvider } from "@/lib/player/PlayerProvider";
import { PlayerBar } from "@/components/player/PlayerBar";

export const metadata: Metadata = {
  title: "Island Waves — Caribbean Radio Hub",
  description:
    "One place to discover and play Caribbean internet radio — reggae, soca, dancehall, zouk, kompa, chutney, and island talk.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        {/*
          PlayerProvider (and its single <audio> element) wraps the whole app so
          playback survives client-side navigation between routed pages. The
          PlayerBar sits alongside {children} for the same reason — both live
          outside the routed segment, so React never unmounts them on nav.
        */}
        <PlayerProvider>
          <header className="site-header">
            <Link href="/" className="site-brand">
              🎧 Island Waves
            </Link>
          </header>
          {children}
          <PlayerBar />
        </PlayerProvider>
      </body>
    </html>
  );
}
