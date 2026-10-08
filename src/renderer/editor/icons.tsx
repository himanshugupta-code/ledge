import type { ReactNode } from "react";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const icons = {
  select: (
    <Icon>
      <path d="M5 3l14 8-6 1.5L10 19z" />
    </Icon>
  ),
  crop: (
    <Icon>
      <path d="M6 2v16h16M2 6h16v16" />
    </Icon>
  ),
  arrow: (
    <Icon>
      <path d="M5 19L19 5M10 5h9v9" />
    </Icon>
  ),
  line: (
    <Icon>
      <path d="M5 19L19 5" />
    </Icon>
  ),
  rect: (
    <Icon>
      <rect x="4" y="6" width="16" height="12" rx="1.5" />
    </Icon>
  ),
  ellipse: (
    <Icon>
      <ellipse cx="12" cy="12" rx="8.5" ry="6.5" />
    </Icon>
  ),
  pen: (
    <Icon>
      <path d="M4 20c3-1 4-4 7-7s6-6 8-8M15 5l4 4" />
    </Icon>
  ),
  highlight: (
    <Icon>
      <path d="M9 15l-3 3h5l1.5-1.5M9 15l7.5-7.5a2.1 2.1 0 013 3L12 18M9 15l3 3" />
      <path d="M4 21h16" />
    </Icon>
  ),
  text: (
    <Icon>
      <path d="M5 6V4h14v2M12 4v16M9 20h6" />
    </Icon>
  ),
  pixelate: (
    <Icon>
      <path d="M4 4h5v5H4zM9 9h6v6H9zM15 4h5v5h-5zM4 15h5v5H4zM15 15h5v5h-5z" />
    </Icon>
  ),
  undo: (
    <Icon>
      <path d="M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3" />
    </Icon>
  ),
  redo: (
    <Icon>
      <path d="M15 14l5-5-5-5M20 9H9a5 5 0 000 10h3" />
    </Icon>
  ),
  rotateLeft: (
    <Icon>
      <path d="M3 4v6h6" />
      <path d="M3.5 13.5A8.5 8.5 0 105 7.5L3 10" />
    </Icon>
  ),
  rotateRight: (
    <Icon>
      <path d="M21 4v6h-6" />
      <path d="M20.5 13.5A8.5 8.5 0 1119 7.5L21 10" />
    </Icon>
  ),
  flipX: (
    <Icon>
      <path d="M12 3v18M9 7L4 17h5zM15 7l5 10h-5z" />
    </Icon>
  ),
  flipY: (
    <Icon>
      <path d="M3 12h18M7 9L17 4v5zM7 15l10 5v-5z" />
    </Icon>
  ),
  copy: (
    <Icon>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" />
    </Icon>
  ),
};
