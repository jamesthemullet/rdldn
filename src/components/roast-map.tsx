import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
// import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

interface Marker {
  lat: number;
  lng: number;
  label?: string;
  rating: number;
  slug?: string;
  closed?: string;
}

interface Props {
  markers: Marker[];
}

const getMarkerColor = (rating: number): { colour: string; backgroundColour: string } => {
  if (rating >= 9) return { colour: "#fff", backgroundColour: "#4B0082" };
  if (rating >= 8.5) return { colour: "#fff", backgroundColour: "#83539B" };
  if (rating >= 8) return { colour: "#fff", backgroundColour: "#588EB5" };
  if (rating >= 7.5) return { colour: "#000", backgroundColour: "#51A790" };
  if (rating >= 7) return { colour: "#000", backgroundColour: "#4D7833" };
  if (rating >= 6.5) return { colour: "#000", backgroundColour: "#6A972A" };
  if (rating >= 6) return { colour: "#000", backgroundColour: "#CFB920" };
  if (rating >= 5) return { colour: "#fff", backgroundColour: "#CF7C1D" };
  if (rating >= 4) return { colour: "#fff", backgroundColour: "#FF0000" };
  if (rating >= 3) return { colour: "#fff", backgroundColour: "#8B0000" };
  return { colour: "#fff", backgroundColour: "#000000" };
};

const createColouredIcon = (colour: string, backgroundColour: string, value: number) => {
  const formattedValue = value.toFixed(1);
  return L.divIcon({
    className: "",
    html: `
      <svg width="32" height="48" viewBox="0 0 32 48" xmlns="http://www.w3.org/2000/svg">
        <path d="
          M16 47
          C16 47, 14 36, 8 24
          A12 12 0 1 1 24 24
          C18 36, 16 47, 16 47Z
        "
        fill="${backgroundColour}" stroke="#000" stroke-width="2"/>
        <text x="16" y="16" text-anchor="middle" font-size="13" font-family="Arial" fill="${colour}" font-weight="bold" dominant-baseline="middle">
          ${formattedValue}
        </text>
      </svg>
    `,
  });
};

export default function RoastMap({ markers }: Props) {
  console.log(20, markers)
  const mapRef = useRef<HTMLDivElement>(null);
  const [showClosed, setShowClosed] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current).setView([51.505, -0.09], 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // biome-ignore lint/complexity/noForEach: <explanation>
    markers.forEach(({ lat, lng, label, rating, slug, closed }) => {
      if (!showClosed && closed) {
        return;
      }

      if (!lat || !lng) {
        console.warn("Invalid marker coordinates:", { lat, lng, slug });
        return;
      }

      const { colour, backgroundColour } = getMarkerColor(rating);
      const icon = createColouredIcon(colour, backgroundColour, rating);
      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`<a href="/${slug}">${label}</a> - ${rating}/10`);
    });

    return () => {
      map.remove();
    };
  }, [markers, showClosed]);

  return (
    <>
      <p>Also show places that have closed down?</p>
      <label>
        <input
          type="checkbox"
          checked={showClosed}
          onChange={(e) => setShowClosed(e.target.checked)}
        />
        Show closed places
      </label>
      <br />
      <br />
      {/** biome-ignore lint/correctness/useUniqueElementIds: <explanation> */}
      <div id="map" ref={mapRef} style={{ height: "600px" }} />
    </>
  );
}
