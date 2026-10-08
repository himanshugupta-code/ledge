import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ThemeToggle } from "../components/ThemeToggle";
import { asset, RELEASE, REPO } from "../lib/site";
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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("ledge-theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`,
          }}
        />
      </head>
      <body>
        <header className="nav">
          <div className="wrap">
            <Link href="/" className="brand">
              <img src={asset("/icon.png")} alt="" width={22} height={22} />
              Ledge
            </Link>
            <nav aria-label="Main">
              <Link href="/privacy/" className="hide-sm">Privacy</Link>
              <Link href="/support/" className="hide-sm">Support</Link>
              <a href={REPO} className="hide-sm">GitHub</a>
              <ThemeToggle />
              <a href={RELEASE} className="pill">Download</a>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="site">
          <div className="wrap">
            <span>© 2026 Himanshu. Ledge is free and keeps everything on your Mac.</span>
            <span>
              <Link href="/privacy/">Privacy policy</Link> &nbsp;·&nbsp; <Link href="/support/">Support</Link> &nbsp;·&nbsp;{" "}
              <a href={REPO}>Source</a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
