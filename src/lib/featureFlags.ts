type FlagKey = "myPassport";

export const FLAG_DEFINITIONS: Record<FlagKey, { label: string; description: string; defaultValue: boolean }> = {
  myPassport: {
    label: "My Passport",
    description: "Controls access to the My Roast Dinner Passport page.",
    defaultValue: false,
  },
};
