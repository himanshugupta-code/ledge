import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import createMDX from "@next/mdx";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const withMDX = createMDX({
  options: { remarkPlugins: ["remark-gfm"] },
});

/** @type {import('next').NextConfig} */
export default withMDX({
  output: "export",
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
});
