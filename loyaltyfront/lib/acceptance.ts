/** Which tokens a restaurant accepts. Values match `RestaurantRegistry.AcceptanceMode`. */
export const AcceptanceMode = {
  OwnTokenOnly: 0,
  AllTokens: 1,
  SelectedPartners: 2,
} as const;

export type AcceptanceMode = (typeof AcceptanceMode)[keyof typeof AcceptanceMode];

export const ACCEPTANCE_OPTIONS: ReadonlyArray<{
  mode: AcceptanceMode;
  label: string;
  hint: string;
}> = [
  {
    mode: AcceptanceMode.OwnTokenOnly,
    label: "Only my own token",
    hint: "Customers can spend only your points here.",
  },
  {
    mode: AcceptanceMode.AllTokens,
    label: "Tokens of all restaurants",
    hint: "Every restaurant token on LoyalChain, including ones created later.",
  },
  {
    mode: AcceptanceMode.SelectedPartners,
    label: "Tokens of restaurants I work with",
    hint: "Only the restaurants you tick below.",
  },
];

const SHORT_LABELS: Record<AcceptanceMode, string> = {
  [AcceptanceMode.OwnTokenOnly]: "Own token only",
  [AcceptanceMode.AllTokens]: "All tokens",
  [AcceptanceMode.SelectedPartners]: "Selected restaurants",
};

export function acceptanceLabel(mode: AcceptanceMode) {
  return SHORT_LABELS[mode];
}

/** Reads the mode returned by the contract. Anything unexpected is treated as the strictest mode. */
export function toAcceptanceMode(value: unknown): AcceptanceMode {
  const mode = Number(value);
  return mode === AcceptanceMode.AllTokens || mode === AcceptanceMode.SelectedPartners
    ? mode
    : AcceptanceMode.OwnTokenOnly;
}
