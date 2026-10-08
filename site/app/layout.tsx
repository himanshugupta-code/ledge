import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { asset, REPO } from "../lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Ledge: a shelf for your screenshots", template: "%s · Ledge" },
  description:
    "Ledge keeps your latest screenshots on a slim shelf at the top edge of your screen. Drag them into any app, copy, or mark them up.",
  icons: { icon: asset("/icon.png") },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="wrap">
          <header className="site">
            <Link href="/" className="brand">
              <img src={asset("/icon.png")} alt="" width={32} height={32} />
              Ledge
            </Link>
            <nav aria-label="Main">
              <Link href="/privacy/">Privacy</Link>
              <Link href="/support/">Support</Link>
              <a href={REPO}>GitHub</a>
            </nav>
          </header>
          <main>{children}</main>
          <footer className="site">
            <span>© 2026 Himanshu</span>
            <span>
              <Link href="/privacy/">Privacy policy</Link> · <Link href="/support/">Support</Link> ·{" "}
              <a href={REPO}>Source</a>
            </span>
          </footer>
        </div>
      </body>
    </html>
  );
}
