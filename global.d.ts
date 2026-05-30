declare const Alpine: {
  data: (name: string, callback: () => Record<string, unknown>) => void;
};

interface ClerkUser {
  id: string;
}

interface ClerkInstance {
  loaded: boolean;
  user: ClerkUser | null | undefined;
  addListener: (callback: () => void) => void;
}

interface Window {
  Clerk?: ClerkInstance;
}
