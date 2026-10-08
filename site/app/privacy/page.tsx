import type { Metadata } from "next";
import { SUPPORT } from "../../lib/site";

export const metadata: Metadata = { title: "Privacy policy" };

export default function Privacy() {
  return (
    <article className="doc">
      <h1>Ledge privacy policy</h1>
      <p>Ledge does not collect, store, or transmit any personal data.</p>
      <ul>
        <li>Ledge reads image files only from the screenshot folder you choose.</li>
        <li>Screenshots and Ledge&apos;s settings stay on your Mac. Nothing is sent to any server.</li>
        <li>Ledge has no accounts, analytics, advertising, or third-party SDKs.</li>
      </ul>
      <p>
        Questions: open an issue at <a href={SUPPORT}>{SUPPORT}</a>.
      </p>
    </article>
  );
}
