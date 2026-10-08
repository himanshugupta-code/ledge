import type { MDXComponents } from "mdx/types";
import { BASE } from "./lib/site";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
    // Site-relative links need the GitHub Pages base path.
    a: ({ href, ...props }) => <a href={typeof href === "string" && href.startsWith("/") ? `${BASE}${href}` : href} {...props} />,
  };
}
