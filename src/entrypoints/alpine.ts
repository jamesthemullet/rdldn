import type { Alpine } from "alpinejs";

interface WishlistButtonAlpineProps {
  postSlug: string;
  postTitle: string;
  postRating?: string;
}

interface WindowClerk {
  loaded: boolean;
  user: unknown;
  addListener(callback: () => void): void;
}

export default (Alpine: Alpine) => {
  Alpine.data("wishlistButton", (props: WishlistButtonAlpineProps) => {
    const { postSlug, postTitle, postRating } = props;
    return {
      saved: false,
      signedOut: false,
      loading: false,

      async init() {
        const clerk = (window as Window & { Clerk?: WindowClerk }).Clerk;
        if (!clerk) {
          this.signedOut = true;
          return;
        }
        // Wait for Clerk to finish loading if it hasn't yet
        if (!clerk.loaded) {
          await new Promise<void>((resolve) => clerk.addListener(() => resolve()));
        }
        if (!clerk.user) {
          this.signedOut = true;
          return;
        }
        // Check if this post is already in the user's wishlist
        try {
          const res = await fetch("/api/wishlist");
          if (res.ok) {
            const items: { postSlug: string }[] = await res.json();
            this.saved = items.some((item) => item.postSlug === postSlug);
          }
        } catch {
          // ignore — saved stays false
        }
      },

      async toggle() {
        if (this.loading) return;
        this.loading = true;
        try {
          if (this.saved) {
            const res = await fetch(`/api/wishlist/${postSlug}`, { method: "DELETE" });
            if (res.ok) this.saved = false;
          } else {
            const res = await fetch("/api/wishlist", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ postSlug, postTitle, postRating }),
            });
            if (res.ok) this.saved = true;
          }
        } finally {
          this.loading = false;
        }
      },
    };
  });

  queueMicrotask(() => {
    if (document.readyState !== "loading") {
      Alpine.start();
    }
  });
};
