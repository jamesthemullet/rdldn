declare const Alpine: {
  data: (name: string, callback: () => Record<string, unknown>) => void;
};

type ClerkUser = {
  id: string;
};

type ClerkInstance = {
  loaded: boolean;
  user: ClerkUser | null | undefined;
  addListener: (callback: () => void) => void;
};

interface Window {
  Clerk?: ClerkInstance;
}
