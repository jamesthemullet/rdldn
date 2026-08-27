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

type PassportLeaderboardOptInProps = {
  initialOptIn: boolean;
  initialDisplayName: string | null;
};

function isVisitTrackingFlagEnabled(): boolean {
  const match = document.cookie.match(/(^| )flag_visitTracking=([^;]+)/);
  const val = match ? match[2] : null;
  return val === "true";
}

export default (alpine: AlpineInstance) => {
  window.Alpine = alpine;

  alpine.data("wishlistButton", (props: WishlistButtonProps = {} as WishlistButtonProps) => {
    const { postSlug, postTitle, postRating } = props;
    return {
      saved: false,
      signedOut: false,
      loading: false,

      async init() {
        const clerk = window.Clerk;
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
      flagEnabled: isVisitTrackingFlagEnabled(),
      loading: false,

      async init() {
        if (!this.flagEnabled) return;
        const clerk = window.Clerk;
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

  alpine.data(
    "passportLeaderboardOptIn",
    (props: PassportLeaderboardOptInProps = {} as PassportLeaderboardOptInProps) => {
      const { initialOptIn, initialDisplayName } = props;
      return {
        optedIn: initialOptIn,
        displayName: initialDisplayName ?? "",
        saving: false,
        error: "",

        async toggleOptIn() {
          if (this.saving) return;
          const nextOptIn = !this.optedIn;

          if (nextOptIn && !this.displayName.trim()) {
            this.error = "Enter a display name to join the leaderboard.";
            return;
          }

          this.saving = true;
          this.error = "";
          try {
            const res = await fetch("/api/passport/leaderboard/opt-in", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ optIn: nextOptIn, displayName: this.displayName.trim() }),
            });
            if (res.ok) {
              this.optedIn = nextOptIn;
            } else {
              const data = await res.json().catch(() => ({}));
              this.error = data.error || "Something went wrong.";
            }
          } catch {
            this.error = "Could not connect. Please try again.";
          } finally {
            this.saving = false;
          }
        },
      };
    }
  );

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => alpine.start());
  } else {
    alpine.start();
  }
};
