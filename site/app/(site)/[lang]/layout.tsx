import { notFound } from "next/navigation";
import { Document } from "../../../components/Document";
import { baseMetadata, baseViewport } from "../../../lib/base-metadata";
import { isLocale, locales } from "../../../lib/i18n";
import "../../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export const metadata = baseMetadata;
export const viewport = baseViewport;

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  return <Document lang={lang}>{children}</Document>;
}
