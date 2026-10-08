import { Reveal } from "../components/Reveal";
import { ScrollScale } from "../components/ScrollScale";
import { asset, RELEASE } from "../lib/site";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="shelf-wrap">
          <img
            className="for-light"
            src={asset("/ledge-light.png")}
            alt="A frosted glass ledge across the top of the screen holding six screenshot thumbnails."
            width={2560}
            height={336}
          />
          <img className="for-dark" src={asset("/ledge-dark.png")} alt="" width={2560} height={336} />
        </div>
        <div className="wrap copy">
          <p className="eyebrow">Ledge</p>
          <h1>A shelf for your screenshots.</h1>
          <p className="sub">
            Your newest screenshots wait along the top of the screen, out of the way until you reach for them.
          </p>
          <div className="cta">
            <a className="btn" href={RELEASE}>Download for Mac</a>
            <a className="btn ghost" href="#video">Watch the film</a>
          </div>
          <p className="note">Free. macOS on Apple silicon. Mac App Store version in review.</p>
        </div>
      </section>

      <section className="band center">
        <div className="wrap">
          <Reveal as="h2" className="display">
            Always there.<br />
            <span className="grad">Never in the way.</span>
          </Reveal>
          <Reveal as="p" className="lede" delay={120}>
            Rest the pointer against the top edge and the ledge slides down. Move away and it tucks itself back
            up. No window to manage, no folder to dig through.
          </Reveal>
        </div>
      </section>

      <section className="band alt">
        <div className="wrap">
          <Reveal as="h2" className="display center">Everything within reach.</Reveal>
          <div className="bento">
            <Reveal className="tile t-a">
              <div className="big">One gesture.</div>
              <h3>Reach the top edge. Or press a key.</h3>
              <p>The ledge appears on whichever screen your pointer is on, and tucks away when you are done.</p>
              <div className="kbds"><kbd>⌘</kbd><kbd>⌥</kbd><kbd>L</kbd></div>
            </Reveal>
            <Reveal className="tile t-b" delay={100}>
              <h3>Drag into anything.</h3>
              <p>Drop a screenshot into Messages, Mail, Slack or a doc. Or copy it in one click.</p>
            </Reveal>
            <Reveal className="tile t-c" delay={60}>
              <h3>Keyboard friendly.</h3>
              <p><kbd>Tab</kbd> to pick, <kbd>Enter</kbd> to edit, <kbd>C</kbd> to copy, <kbd>Esc</kbd> to tuck away.</p>
            </Reveal>
            <Reveal className="tile t-d" delay={140}>
              <h3>Quietly tidy.</h3>
              <p>Lives in the menu bar. No Dock icon. Optionally moves new screenshots off your Desktop.</p>
            </Reveal>
            <Reveal className="tile t-e" delay={220}>
              <h3>Peeks when it matters.</h3>
              <p>A brief peek tells you a new screenshot just landed, then it gets out of the way.</p>
            </Reveal>
            <Reveal className="tile t-f">
              <div className="big grad">Private by design.</div>
              <p>Everything stays on your Mac. No account, no network requests, no analytics.</p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="band center">
        <div className="wrap">
          <Reveal as="h2" className="display">
            Mark it up.<br />
            <span className="grad">Then send it.</span>
          </Reveal>
          <Reveal as="p" className="lede" delay={120}>
            Click any screenshot to open the editor. Annotate with arrows and text, pixelate passwords and keys,
            adjust the light, crop and rotate. Undo anything.
          </Reveal>
          <ScrollScale>
            <img
              src={asset("/editor.png")}
              alt="The Ledge editor with a tool rail, an annotated screenshot with pixelated keys, and style and adjust panels."
              width={1280}
              height={820}
            />
          </ScrollScale>
        </div>
      </section>

      <section className="band alt center" id="video">
        <div className="wrap">
          <Reveal as="h2" className="display">See it in 40 seconds.</Reveal>
          <Reveal>
            <video controls preload="none" poster={asset("/ledge-intro-poster.jpg")}>
              <source src={asset("/ledge-intro.mp4")} type="video/mp4" />
            </video>
          </Reveal>
        </div>
      </section>

      <section className="band center">
        <div className="wrap">
          <Reveal as="h2" className="display">Get Ledge.</Reveal>
          <Reveal as="p" className="lede" delay={100}>
            Free for Mac. The Mac App Store version is in review. Until it is live, download it from GitHub
            Releases.
          </Reveal>
          <Reveal delay={200}>
            <p style={{ marginTop: 32 }}>
              <a className="btn" href={RELEASE}>Download for Mac</a>
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
