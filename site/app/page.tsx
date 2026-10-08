import { asset, RELEASE } from "../lib/site";

const features = [
  ["Top-edge shelf", "Rest the pointer at the top of the screen, or press Cmd+Option+L, and your latest screenshots slide into view. Move away and it tucks itself back up."],
  ["Drag into anything", "Drop a screenshot straight into Messages, Mail, Slack or a doc. Or copy it to the clipboard in one click."],
  ["Mark up before sharing", "Arrows, text, highlights, and pixelate for passwords and personal details. Brightness, contrast, crop and rotate too."],
  ["Out of the way", "Lives in the menu bar with no Dock icon and no window. Peeks briefly when a new screenshot arrives."],
  ["Private by design", "Everything stays on your Mac. No account, no network requests, no analytics."],
  ["Keyboard friendly", "Tab to a screenshot, Enter to edit, C to copy, Delete to remove, Esc to tuck the ledge away."],
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>A shelf for your screenshots</h1>
        <p>
          Your newest screenshots wait along the top of the screen, out of the way until you reach for them.
        </p>
        <div className="cta">
          <a className="btn" href={RELEASE}>Download for Mac</a>
          <a className="btn ghost" href="#video">Watch the intro</a>
        </div>
      </section>

      <picture className="shelf">
        <source media="(prefers-color-scheme: dark)" srcSet={asset("/ledge-dark.png")} />
        <img
          className="shot"
          src={asset("/ledge-light.png")}
          alt="A frosted glass ledge across the top of the screen holding six screenshot thumbnails."
          width={2560}
          height={336}
        />
      </picture>

      <div className="grid">
        {features.map(([title, text]) => (
          <div className="card" key={title}>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        ))}
      </div>

      <section className="block two">
        <div>
          <h2>Edit right on the ledge</h2>
          <p className="lead">
            Click any screenshot to open the built-in editor. Annotate, blur out secrets, adjust and crop,
            with full undo, then save or copy.
          </p>
        </div>
        <img
          className="shot"
          src={asset("/editor.png")}
          alt="The Ledge editor with a tool rail, an annotated screenshot with pixelated keys, and style and adjust panels."
          width={1280}
          height={820}
        />
      </section>

      <section className="block" id="video">
        <h2>See it in 40 seconds</h2>
        <video controls preload="none" poster={asset("/ledge-intro-poster.jpg")}>
          <source src={asset("/ledge-intro.mp4")} type="video/mp4" />
        </video>
      </section>

      <section className="block">
        <h2>Get Ledge</h2>
        <p className="lead">
          Free for macOS on Apple silicon. The Mac App Store version is in review. Until it is live you can
          download the app from <a href={RELEASE}>GitHub Releases</a>.
        </p>
        <p>
          <a className="btn" href={RELEASE}>Download for Mac</a>
        </p>
      </section>
    </>
  );
}
