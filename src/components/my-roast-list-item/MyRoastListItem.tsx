import { memo, useEffect, useState } from "react";

function useAuthFlag(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    const match = document.cookie.match(/(^| )flag_authFeatures=([^;]+)/);
    const val = match ? match[2] : null;
    setEnabled(val === null ? false : val === "true");
  }, []);
  return enabled;
}

type MyRoastListItemProps = {
  imgSrc: string;
};

export const MyRoastListItem = memo(function MyRoastListItem({ imgSrc }: MyRoastListItemProps) {
  const enabled = useAuthFlag();
  if (!enabled) return null;
  return (
    <li className="heading">
      <h3>
        <a href="/my-roasts" rel="noopener noreferrer">
          My Roast List
        </a>
      </h3>
      <a href="/my-roasts" rel="noopener noreferrer" className="featured-image">
        <img src={imgSrc} alt="My roast list" width="400" height="300" loading="lazy" />
      </a>
    </li>
  );
});
