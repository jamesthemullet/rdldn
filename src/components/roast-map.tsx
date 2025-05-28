import L from 'leaflet';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

interface Marker {
  lat: number;
  lng: number;
  label?: string;
  rating: number;
}

interface Props {
  markers: Marker[];
}

const getMarkerColor = (rating: number) => {
  if (rating >= 8) return 'green';
  if (rating >= 7) return 'orange';
  if (rating >= 6) return 'yellow';
  return 'red';
};

const createColoredIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color:${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

export default function RoastMap({ markers }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = L.map(mapRef.current).setView([51.505, -0.09], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // biome-ignore lint/complexity/noForEach: <explanation>
    markers.forEach(({ lat, lng, label, rating }) => {
      const color = getMarkerColor(rating);
      const icon = createColoredIcon(color);

      L.marker([lat, lng], { icon }).addTo(map).bindPopup(`${label} - ${rating} out of 10`);
    });

    return () => {
      map.remove();
    };
  }, [markers]);

  return <div id="map" ref={mapRef} style={{ height: '600px' }} />;
}
