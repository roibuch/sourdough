export type GlossaryTerm =
  | "autolyse"
  | "fermentolyse"
  | "retard"
  | "inoculation"
  | "hydration"
  | "bassinage"
  | "bulk"
  | "ddt"
  | "float-test"
  | "true-hydration"
  | "manitoba"
  | "levain";

export interface GlossaryEntry {
  label: string;
  short: string;
  detail: string;
}
