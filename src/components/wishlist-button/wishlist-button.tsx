import { useAuth } from "@clerk/astro/react";
import { useEffect, useState } from "react";
import "./wishlist-button.css";

function useAuthFlag(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    const match = document.cookie.match(/(^| )flag_authFeatures=([^;]+)/);
    const val = match ? match[2] : null;
    setEnabled(val === null ? false : val === "true");
  }, []);
  return enabled;
}

type Props = {
  postSlug: string;
  postTitle: string;
  postRating?: string | null;
  iconOnly?: boolean;
  isSaved?: boolean;
  onSaveToggle?: (slug: string, nowSaved: boolean) => void;
};

export default function WishlistButton({ postSlug, postTitle, postRating, iconOnly = false, isSaved, onSaveToggle }: Props) {
  const flagEnabled = useAuthFlag();
  const { isSignedIn, isLoaded } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const controlled = isSaved !== undefined;

  useEffect(() => {
    if (controlled) {
      setLoading(false);
      return;
    }
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((items: { postSlug: string }[]) => {
        setSaved(items.some((i) => i.postSlug === postSlug));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn, postSlug, controlled]);

  if (!flagEnabled || !isLoaded || loading) return null;

  if (!isSignedIn) {
    if (iconOnly) return null;
    return (
      <a href="/sign-in" className="wishlist-btn wishlist-sign-in">
        Sign in to save this to your list
      </a>
    );
  }

  const currentlySaved = controlled ? (isSaved ?? false) : saved;

  async function toggle(): Promise<void> {
    if (currentlySaved) {
      await fetch(`/api/wishlist/${postSlug}`, { method: "DELETE" });
      if (controlled) onSaveToggle?.(postSlug, false);
      else setSaved(false);
    } else {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postSlug, postTitle, postRating }),
      });
      if (controlled) onSaveToggle?.(postSlug, true);
      else setSaved(true);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`wishlist-btn ${iconOnly ? "wishlist-btn--icon-only" : ""} ${currentlySaved ? "wishlist-btn--saved" : ""}`}
      aria-label={currentlySaved ? "Remove from your list" : "Save to your list"}
      aria-pressed={currentlySaved}
    >
      <span aria-hidden="true" className="wishlist-btn__icon">
        {currentlySaved ? (
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor"><path d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z"/></svg>
        ) : (
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="1em" height="1em" fill="currentColor"><path d="M244 84L255.1 96L267.1 84.02C300.6 51.37 347 36.51 392.6 44.1C461 55.58 512 115.2 512 185.1V190.9C512 232.4 494.8 272.1 464.4 300.4L283.7 469.1C276.2 476.1 266.3 480 256 480C245.7 480 235.8 476.1 228.3 469.1L47.59 300.4C17.23 272.1 0 232.4 0 190.9V185.1C0 115.2 51.03 55.58 119.4 44.1C164.1 36.51 211.4 51.37 244 84zM255.1 163.9L210.1 117.1C188.4 96.28 157.6 86.4 127.3 91.44C81.55 99.07 48 138.7 48 185.1V190.9C48 219.1 59.71 246.1 80.34 265.3L256 429.3L431.7 265.3C452.3 246.1 464 219.1 464 190.9V185.1C464 138.7 430.4 99.07 384.7 91.44C354.4 86.4 323.6 96.28 301.9 117.1L255.1 163.9z"/></svg>
        )}
      </span>{" "}
      {!iconOnly && (currentlySaved ? "Saved to your list" : "Save to your list")}
    </button>
  );
}
