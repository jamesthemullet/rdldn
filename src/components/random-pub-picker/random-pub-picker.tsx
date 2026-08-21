import { useEffect, useState } from "react";
import "./random-pub-picker.css";

const QUERY_PARAM = "randomPub";

type Props = {
  pubs: string[];
};

export default function RandomPubPicker({ pubs }: Props) {
  const [enabled, setEnabled] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setEnabled(params.has(QUERY_PARAM));
  }, []);

  if (!enabled || pubs.length === 0) return null;

  function pickRandomPub(): void {
    const index = Math.floor(Math.random() * pubs.length);
    setSelected(pubs[index]);
  }

  return (
    <div className="random-pub-picker">
      <button type="button" className="random-pub-picker__btn" onClick={pickRandomPub}>
        {selected ? "Pick another" : "Pick a random pub for me"}
      </button>
      {selected && (
        <p className="random-pub-picker__result">
          Tonight's roast: <strong>{selected}</strong>
        </p>
      )}
    </div>
  );
}
