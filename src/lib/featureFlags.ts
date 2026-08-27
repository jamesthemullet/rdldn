type FlagKey = "visitTracking" | "myPassport";

export const FLAG_DEFINITIONS: Record<FlagKey, { label: string; description: string; defaultValue: boolean }> = {
  visitTracking: {
    label: "Mark As Visited",
    description: "Controls visibility of the mark as visited feature on review pages.",
    defaultValue: false,
  },
  myPassport: {
    label: "My Passport",
    description: "Controls access to the My Roast Dinner Passport page.",
    defaultValue: false,
  },
};
