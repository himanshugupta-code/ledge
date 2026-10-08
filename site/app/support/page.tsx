import type { Metadata } from "next";
import { SUPPORT } from "../../lib/site";

export const metadata: Metadata = { title: "Support" };

export default function Support() {
  return (
    <article className="doc">
      <h1>Support</h1>
      <p>
        Found a bug or have an idea? <a href={SUPPORT}>Open an issue on GitHub</a>.
      </p>
      <h2>Getting started</h2>
      <ol>
        <li>On first launch, choose the folder where your screenshots are saved (the macOS default is Desktop).</li>
        <li>Take a screenshot with <kbd>Cmd</kbd> <kbd>Shift</kbd> <kbd>3</kbd>.</li>
        <li>Move the pointer to the top edge of the screen, or press <kbd>Cmd</kbd> <kbd>Option</kbd> <kbd>L</kbd>, to show the ledge.</li>
      </ol>
      <h2>Nothing appears on the ledge</h2>
      <p>Make sure the folder you chose is the one macOS saves screenshots to. Ledge only looks at that folder.</p>
    </article>
  );
}
