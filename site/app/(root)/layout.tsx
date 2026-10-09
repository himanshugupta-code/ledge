import { Document } from "../../components/Document";
import { baseMetadata, baseViewport } from "../../lib/base-metadata";
import "../globals.css";

export const metadata = baseMetadata;
export const viewport = baseViewport;

/** "/" serves the English site directly. Its canonical URL is /en/, so search engines index one copy. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <Document lang="en">{children}</Document>;
}
