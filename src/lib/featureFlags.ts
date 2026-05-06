export type FlagKey = "authFeatures";

export const FLAG_DEFINITIONS: Record<FlagKey, { label: string; description: string; defaultValue: boolean }> = {
  authFeatures: {
    label: "Sign-in, My Roasts & Profile",
    description: "Controls visibility of sign-in buttons, user profile and My Roasts navigation.",
    defaultValue: true,
  },
};
