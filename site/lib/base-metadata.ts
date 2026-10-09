import type { Metadata, Viewport } from "next";
import { asset, SITE_URL } from "./site";

export const baseMetadata: Metadata = {
  metadataBase: new URL(`${SITE_URL}/`),
  applicationName: "Ledge",
  authors: [{ name: "Himanshu", url: "https://github.com/himanshugupta-code" }],
  creator: "Himanshu",
  category: "utilities",
  icons: { icon: asset("/icon.png"), apple: asset("/icon.png") },
  robots: { index: true, follow: true },
};

export const baseViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfd" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};
