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
  | "whole-wheat"
  | "whole-rye"
  | "bread-flour"
  | "white-wheat"
  | "all-purpose"
  | "levain";

export interface GlossaryEntry {
  label: string;
  short: string;
  detail: string;
}
