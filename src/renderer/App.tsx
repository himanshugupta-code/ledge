import { useEffect, useRef, useState, type WheelEvent } from "react";
import type { LedgeItem } from "../shared/api";
import { Card } from "./Card";

export function App() {
  const [items, setItems] = useState<LedgeItem[]>([]);
  const [visible, setVisible] = useState(false);
  const rowRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    let active = true;
    void window.ledge.getItems().then((initial) => {
      if (active) setItems(initial);
    });
    const offItems = window.ledge.onItems(setItems);
    const offReveal = window.ledge.onReveal(setVisible);
    return () => {
      active = false;
      offItems();
      offReveal();
    };
  }, []);

  useEffect(() => {
    if (visible) rowRef.current?.scrollTo({ left: 0 });
  }, [visible]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") window.ledge.dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onWheel = (event: WheelEvent<HTMLUListElement>) => {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      event.currentTarget.scrollLeft += event.deltaY;
    }
  };

  return (
    <main className="ledge" data-visible={visible} aria-hidden={!visible}>
      <section className="shelf" aria-label="Screenshots">
        {items.length === 0 ? (
          <p className="empty">
            <span className="empty-title">Nothing on the ledge yet</span>
            <span className="empty-hint">Take a screenshot and it lands here.</span>
          </p>
        ) : (
          <ul className="row" ref={rowRef} onWheel={onWheel}>
            {items.map((item) => (
              <li key={item.id}>
                <Card item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="lip" aria-hidden="true" />
    </main>
  );
}
