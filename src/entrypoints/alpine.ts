import type { Clerk as ClerkInstance } from "@clerk/shared/types";
import type { Alpine as AlpineInstance } from "alpinejs";

type WishlistButtonProps = {
  postSlug: string;
  postTitle: string;
  postRating: string | null;
};

type VisitButtonProps = {
  postSlug: string;
  postTitle: string;
  postRating: string | null;
};

function isAuthFeaturesFlagEnabled(): boolean {
  const match = document.cookie.match(/(^| )flag_authFeatures=([^;]+)/);
  const val = match ? match[2] : null;
  return val === "true";
}

export default (alpine: AlpineInstance) => {
  (window as unknown as { Alpine: AlpineInstance }).Alpine = alpine;

  alpine.data("wishlistButton", (props: WishlistButtonProps = {} as WishlistButtonProps) => {
    const { postSlug, postTitle, postRating } = props;
    return {
      saved: false,
      signedOut: false,
      flagEnabled: isAuthFeaturesFlagEnabled(),
      loading: false,

      async init() {
        if (!this.flagEnabled) return;
        const clerk = (window as unknown as { Clerk?: ClerkInstance }).Clerk;
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

  alpine.data("visitButton", (props: VisitButtonProps = {} as VisitButtonProps) => {
    const { postSlug, postTitle, postRating } = props;
    return {
      visited: false,
      signedOut: false,
      flagEnabled: isAuthFeaturesFlagEnabled(),
      loading: false,

      async init() {
        if (!this.flagEnabled) return;
        const clerk = (window as unknown as { Clerk?: ClerkInstance }).Clerk;
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
        // Check if this post is already logged as visited
        try {
          const res = await fetch("/api/visits");
          if (res.ok) {
            const items: { postSlug: string }[] = await res.json();
            this.visited = items.some((item) => item.postSlug === postSlug);
          }
        } catch {
          // ignore — visited stays false
        }
      },

      async toggle() {
        if (this.loading) return;
        this.loading = true;
        try {
          if (this.visited) {
            const res = await fetch(`/api/visits/${postSlug}`, { method: "DELETE" });
            if (res.ok) this.visited = false;
          } else {
            const res = await fetch("/api/visits", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ postSlug, postTitle, postRating }),
            });
            if (res.ok) this.visited = true;
          }
        } finally {
          this.loading = false;
        }
      },
    };
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => alpine.start());
  } else {
    alpine.start();
  }
};
