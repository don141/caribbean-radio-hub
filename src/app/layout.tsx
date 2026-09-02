import type { Metadata } from "next";
import "./globals.css";
import { PlayerProvider } from "@/lib/player/PlayerProvider";
import { PlayerBar } from "@/components/player/PlayerBar";
import { AuthProvider } from "@/lib/auth";
import { AuthGate } from "@/components/auth/AuthGate";
import { SiteHeader } from "@/components/auth/SiteHeader";

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
        {/*
          AuthProvider wraps everything so auth state drives routing app-wide.
          PlayerProvider (single <audio> element) stays mounted across the gate
          so the "keep listening while you browse" promise holds. AuthGate wraps
          only the routed {children}: when a user is required but absent it
          renders the sign-in screen instead, so no catalog markup mounts.
        */}
        <AuthProvider>
          <PlayerProvider>
            <SiteHeader />
            <AuthGate>{children}</AuthGate>
            <PlayerBar />
          </PlayerProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
