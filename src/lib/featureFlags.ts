export type FlagKey = "authFeatures";

export const FLAG_DEFINITIONS: Record<FlagKey, { label: string; description: string; defaultValue: boolean }> = {
  authFeatures: {
    label: "Sign-in, My Roasts & Profile",
    description: "Controls visibility of sign-in buttons, user profile and My Roasts navigation.",
    defaultValue: true,
  },
};

export function getFlag(flag: FlagKey): boolean {
  if (typeof localStorage === "undefined") return FLAG_DEFINITIONS[flag].defaultValue;
  const val = localStorage.getItem(`flag_${flag}`);
  return val === null ? FLAG_DEFINITIONS[flag].defaultValue : val === "true";
}

export function setFlag(flag: FlagKey, value: boolean): void {
  localStorage.setItem(`flag_${flag}`, String(value));
}
